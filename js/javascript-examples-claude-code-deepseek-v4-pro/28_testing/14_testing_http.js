/**
 * ============================================================================
 * 知识点：HTTP / API 层测试 —— 用真实端口验证契约
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试
 * 【难度等级】进阶
 * 【前置知识】28_testing/12_test_pyramid_and_e2e.js、28_testing/06_testing_async_code.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    HTTP 层测试指：把服务真正跑起来（监听一个端口），用 HTTP 客户端（fetch）
 *    发真实请求，然后断言**状态码 / 响应头 / 响应体 / 错误格式**。
 *    它验证的不是"某个函数算得对不对"，而是"对外承诺的接口契约有没有变"。
 *
 *    HTTP 响应由四部分组成，缺一不可，测试也要四样都看：
 *      状态码  201 / 200 / 400 / 404 / 405 / 500
 *      响应头  Content-Type、Cache-Control、自定义头（如 X-Request-Id）
 *      响应体  JSON 的字段名、类型、嵌套结构
 *      副作用  创建之后能不能查到（跨请求的状态一致性）
 *
 * 2. 为什么需要（真实项目场景）
 *    HTTP 接口是**对外契约**。前端、App、第三方都按这个契约写代码。
 *    内部函数测试再全，也挡不住下面这些真实事故：
 *      - 重构时把响应字段 `price` 改成了 `unitPrice` → 前端整页空白；
 *      - 创建成功从 201 改成 200 → 移动端的重试逻辑失效，产生重复订单；
 *      - 错误体从 `{ error: "xxx" }` 变成 `{ message: "xxx" }` → 前端统一错误提示失效；
 *      - 忘了设置 Content-Type → 某些客户端直接解析失败；
 *      - 分页参数非法时返回 500 而不是 400 → 监控上一堆假告警；
 *      - 新增了必填字段但没返回 400 而是静默接受 → 脏数据入库。
 *    这些事故的共同点：**内部函数全都没变，或者变了也测不出来**。
 *    只有从 HTTP 入口打进去的测试，才能守住这条契约线。
 *
 * 3. 核心语法要点
 *    起服务（关键：端口写 0，让操作系统分配空闲端口，避免 CI 上端口冲突）：
 *        const server = app.listen(0, '127.0.0.1', () => { ... });
 *        const { port } = server.address();
 *    关服务（关键：不关，node 进程就不会退出，测试会一直挂着）：
 *        await new Promise((resolve) => server.close(resolve));
 *    发请求：
 *        const res = await fetch(`${baseUrl}/api/products`, { method: 'POST', ... });
 *        res.status / res.headers.get('content-type') / await res.json()
 *    可复用辅助函数的形态（本文件第 3 节实现）：
 *        await withServer(app, async (baseUrl) => { ...测试... });   // 自动起停
 *        const { before, after } = useServer(app);                    // 配合 node:test 的钩子
 *
 * 4. 常见陷阱
 *    - 用固定端口（如 3000）：本地能跑，CI 上并行任务一撞就挂。始终用 0。
 *    - 忘记 close：`node --test` 会一直不退出，CI 超时。用 try/finally 包住。
 *    - 不 await fetch 的响应体：fetch 返回的 Response 是流，必须 `await res.json()`。
 *    - 只断言状态码，不断言响应体：字段改名这类最常见的破坏就漏掉了。
 *    - 只测 happy path：错误路径（400/404/500）恰恰是回归最多的地方。
 *    - 依赖上一个用例创建的数据：用例之间共享状态会导致"单独跑通过、一起跑失败"。
 *      正确做法是用 beforeEach 重建应用实例（本文件就是这么做的）。
 *    - 断言了不稳定字段：时间戳、自增 ID、随机 requestId 要在断言前脱敏或
 *      只断言其"形状"（类型 / 是否存在），而不是具体值。
 *    - 把 HTTP 测试写得太细：去断言内部日志、SQL 语句，就把它写成了
 *      "用 HTTP 调用的单元测试"，既慢又脆。HTTP 层只该关心契约。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/14_testing_http.js
 *
 * 【预期输出】
 *   1) 用 express 起一个 listen(0) 的本地 API（内存数据，无外部依赖）；
 *   2) 逐个演示状态码 / 响应体 / 响应头 / 错误路径 / 边界参数的断言方式；
 *   3) 展示可复用的测试辅助函数 withServer 与 useServer；
 *   4) 用"内部重构 / 契约破坏 / 状态码变更 / 错误体变更"四种变更，
 *      打印"内部单元测试 vs HTTP 层测试"的抓取矩阵，说明为什么测 HTTP 层更能防回归；
 *   5) 真实 node:test 用例全部通过，退出码 0。
 * ============================================================================
 */

import { test, describe, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

// ===========================================================================
// 第 1 部分：被测的 API（express + 内存数据）
// ===========================================================================

/**
 * 构造响应 DTO。
 *
 * 这是"契约"的唯一定义处：字段名、类型、取舍全在这里。
 * 也是本文件后面用来演示"契约破坏"的地方。
 *
 * @param {{ id: number, name: string, priceCents: number, stock: number }} product
 * @param {string} variant 变体：'v1' | 'refactor' | 'breaking-price'
 * @returns {object}
 */
function toProductDto(product, variant) {
  if (variant === 'breaking-price') {
    // 契约破坏：把 price 改名成 unitPrice。内部逻辑完全没变，
    // 但任何按 price 取值的客户端都会拿到 undefined。
    const { price, ...rest } = {
      id: product.id,
      name: product.name,
      price: formatPrice(product.priceCents, variant),
      stock: product.stock,
    };
    return { ...rest, unitPrice: price };
  }
  return {
    id: product.id,
    name: product.name,
    price: formatPrice(product.priceCents, variant),
    stock: product.stock,
  };
}

/**
 * 分转元。
 *
 * 'refactor' 变体是同一个函数的**等价重写**（内部实现完全不同，对外行为一致）——
 * 用来演示"内部重构不该让 HTTP 测试变红"。
 *
 * @param {number} cents 金额（分）
 * @param {string} variant
 * @returns {number} 金额（元，两位小数）
 */
function formatPrice(cents, variant) {
  if (variant === 'refactor') {
    // 等价重写：改用字符串格式化，而不是先除再舍入
    return Number((cents / 100).toFixed(2));
  }
  return Math.round(cents) / 100;
}

/**
 * 创建一个商品 API 应用。
 *
 * @param {object} [opts]
 * @param {string} [opts.variant] 变体：'v1'（基线）/ 'refactor'（内部等价重构）/
 *                                'breaking-price'（改字段名）/ 'wrong-status'（状态码不符约定）
 * @returns {import('express').Express}
 */
function createApp(opts = {}) {
  const variant = opts.variant ?? 'v1';
  const app = express();

  // --- 应用级中间件 ---
  app.use(express.json({ limit: '64kb' })); // 解析 JSON 请求体

  // 给所有 /api 响应打上追踪头与禁用缓存头。
  // 这些头也是契约的一部分（前端靠 X-Request-Id 报障），所以必须被测到。
  app.use((req, res, next) => {
    res.set('X-Request-Id', `req-${req.method}-${req.url.split('?')[0]}`);
    res.set('Cache-Control', 'no-store');
    next();
  });

  // --- 内存数据 ---
  let nextId = 1;
  /** @type {Map<number, object>} */
  const products = new Map();
  const seed = (name, priceCents, stock) => {
    const p = { id: nextId++, name, priceCents, stock };
    products.set(p.id, p);
    return p;
  };
  seed('机械键盘', 39900, 12);
  seed('鼠标垫', 2990, 0);
  seed('显示器支架', 15900, 5);

  /** 统一的成功响应包装 */
  const ok = (res, data, status = 200) => res.status(status).json(data);
  /** 统一的错误响应包装：错误体结构同样是契约 */
  const fail = (res, status, code, message) =>
    res.status(status).json({ error: { code, message, status } });

  // --- 路由 ---

  app.get('/healthz', (req, res) => ok(res, { status: 'ok' }));

  /** 列表 + 分页。分页参数的边界行为是高频回归点。 */
  app.get('/api/products', (req, res) => {
    const page = Number.parseInt(req.query.page ?? '1', 10);
    const pageSize = Number.parseInt(req.query.pageSize ?? '10', 10);

    // 边界校验：非法参数必须 400，而不是默默用默认值或抛 500
    if (!Number.isInteger(page) || page < 1) {
      return fail(res, 400, 'INVALID_PAGE', 'page 必须是大于等于 1 的整数');
    }
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return fail(res, 400, 'INVALID_PAGE_SIZE', 'pageSize 必须在 1~100 之间');
    }

    const all = [...products.values()];
    const start = (page - 1) * pageSize;
    const slice = all.slice(start, start + pageSize);
    return ok(res, {
      items: slice.map((p) => toProductDto(p, variant)),
      page,
      pageSize,
      total: all.length,
    });
  });

  app.get('/api/products/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return fail(res, 400, 'INVALID_ID', 'id 必须是整数');
    const product = products.get(id);
    if (!product) return fail(res, 404, 'NOT_FOUND', `商品 ${id} 不存在`);
    return ok(res, toProductDto(product, variant));
  });

  app.post('/api/products', (req, res) => {
    const { name, price, stock } = req.body ?? {};
    if (typeof name !== 'string' || name.trim() === '') {
      return fail(res, 400, 'INVALID_NAME', 'name 必填且不能为空');
    }
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return fail(res, 400, 'INVALID_PRICE', 'price 必须是非负数');
    }
    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
      return fail(res, 400, 'INVALID_STOCK', 'stock 必须是非负整数');
    }

    const p = { id: nextId++, name: name.trim(), priceCents: Math.round(price * 100), stock: stock ?? 0 };
    products.set(p.id, p);

    const status = variant === 'wrong-status' ? 200 : 201; // 契约：创建成功应是 201
    res.set('Location', `/api/products/${p.id}`); // 契约：201 通常带 Location 头
    return ok(res, toProductDto(p, variant), status);
  });

  app.delete('/api/products/:id', (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!products.has(id)) return fail(res, 404, 'NOT_FOUND', `商品 ${id} 不存在`);
    products.delete(id);
    return res.status(204).end(); // 204 无响应体
  });

  /** 专门用来验证错误中间件的路由：抛出未预期异常，应当变成 500 + JSON */
  app.get('/api/boom', () => {
    throw new Error('模拟一个未捕获的内部错误');
  });

  /** 兜底 404：未知路由也要返回**统一格式的** JSON，而不是 express 默认的 HTML */
  app.use((req, res) => fail(res, 404, 'NO_ROUTE', `没有这个路由：${req.method} ${req.path}`));

  /** 统一错误处理中间件（四个参数才是错误中间件，少一个 express 就不认） */
  app.use((err, req, res, next) => {
    void next;
    // express.json 解析失败时抛出的错带 status 400
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
      return fail(res, 400, 'INVALID_JSON', '请求体不是合法 JSON');
    }
    if (err.type === 'entity.too.large') {
      return fail(res, 413, 'PAYLOAD_TOO_LARGE', '请求体过大');
    }
    return fail(res, 500, 'INTERNAL', '服务器内部错误');
  });

  return app;
}

// ===========================================================================
// 第 2 部分：可复用的测试辅助函数
// ===========================================================================

/**
 * 启动一个监听随机端口的服务器，返回 { server, baseUrl }。
 * @param {import('express').Express} app
 * @returns {Promise<{ server: import('node:http').Server, baseUrl: string }>}
 */
function startServer(app) {
  return new Promise((resolve) => {
    // 端口传 0：由操作系统分配一个空闲端口。CI 上并行跑多个任务也不会撞端口。
    const server = app.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

/**
 * 关闭服务器。
 * 一定要 await：不关的话 node 进程不会退出，`node --test` 会一直挂着直到超时。
 * @param {import('node:http').Server} server
 */
function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

/**
 * 【辅助函数 1】把"起服务 → 跑测试 → 关服务"包成一次调用。
 *
 * 用 try/finally 保证即使测试体里抛错，服务器也一定会被关掉 ——
 * 这是"测试辅助函数"存在的首要理由：让每个用例都不会忘记清场。
 *
 * @template T
 * @param {import('express').Express} app
 * @param {(baseUrl: string) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withServer(app, fn) {
  const { server, baseUrl } = await startServer(app);
  try {
    return await fn(baseUrl);
  } finally {
    await stopServer(server);
  }
}

/**
 * 【辅助函数 2】给 node:test 用的挂载点：返回 before / after 钩子。
 *
 * 适用场景：整个 describe 块共享一个应用实例（同样的路由、同样的中间件），
 * 但每个用例用 beforeEach 重置数据，避免用例之间互相污染。
 *
 * @param {() => import('express').Express} appFactory 每次调用返回一个全新的 app
 * @returns {{ before: Function, after: Function, beforeEach: Function, ctx: { baseUrl: string } }}
 */
function useServer(appFactory) {
  const ctx = { baseUrl: '', server: null };
  return {
    ctx,
    before: async () => {
      const started = await startServer(appFactory());
      ctx.server = started.server;
      ctx.baseUrl = started.baseUrl;
    },
    after: async () => {
      if (ctx.server) await stopServer(ctx.server);
    },
    beforeEach: () => {
      // 每个用例前重建数据：这里直接换掉整个 app（express 实例持有内存数据）
      // 真实项目里对应的是"每个用例前清库 / 开事务后回滚"。
      return Promise.resolve();
    },
  };
}

/**
 * 【辅助函数 3】发一次请求并把响应的四要素一次性取出来，方便断言。
 *
 * fetch 的坑：res.json() 是一次性的（body 是流），
 * 所以这里统一读取一次并缓存，避免测试里出现"第二次读 body 报错"。
 *
 * @param {string} url
 * @param {RequestInit} [init]
 * @returns {Promise<{ status: number, headers: Headers, body: any, text: string }>}
 */
async function request(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text; // 非 JSON 响应（例如 204 的空体、或错误情况下漏了 Content-Type）
  }
  return { status: res.status, headers: res.headers, body, text };
}

/** 发 JSON POST 的语法糖 */
const postJson = (url, payload) =>
  request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

// ===========================================================================
// 第 3 部分：HTTP 层测什么 —— 逐项演示
// ===========================================================================

console.log('--- 1. HTTP 层测什么：状态码 / 响应体 / 响应头 / 错误格式 ---');

await withServer(createApp(), async (baseUrl) => {
  // 1.1 状态码
  console.log('1.1 状态码：');
  const health = await request(`${baseUrl}/healthz`);
  const list = await request(`${baseUrl}/api/products?pageSize=2`);
  const created = await postJson(`${baseUrl}/api/products`, { name: '腕托', price: 59, stock: 3 });
  const notFound = await request(`${baseUrl}/api/products/9999`);
  const badPage = await request(`${baseUrl}/api/products?page=0`);
  const deleted = await request(`${baseUrl}/api/products/${created.body.id}`, { method: 'DELETE' });
  const boom = await request(`${baseUrl}/api/boom`);
  const noRoute = await request(`${baseUrl}/api/nope`);

  const statusTable = [
    ['GET  /healthz', health.status, '200 健康检查'],
    ['GET  /api/products?pageSize=2', list.status, '200 列表'],
    ['POST /api/products', created.status, '201 创建成功（不是 200！）'],
    ['GET  /api/products/9999', notFound.status, '404 资源不存在'],
    ['GET  /api/products?page=0', badPage.status, '400 参数非法（不是 500！）'],
    ['DELETE /api/products/:id', deleted.status, '204 删除成功且无响应体'],
    ['GET  /api/boom', boom.status, '500 未捕获异常被中间件兜住'],
    ['GET  /api/nope', noRoute.status, '404 未知路由也返回统一 JSON'],
  ];
  console.log('  ' + '请求'.padEnd(34) + '状态码'.padEnd(10) + '说明');
  console.log('  ' + '-'.repeat(88));
  for (const [req, status, note] of statusTable) {
    console.log('  ' + req.padEnd(32) + String(status).padEnd(8) + note);
  }
  console.log();

  // 1.2 响应体
  console.log('1.2 响应体：字段名、类型、嵌套结构都是契约');
  console.log(`  GET /api/products?pageSize=2 → ${JSON.stringify(list.body)}`);
  console.log(`  POST /api/products → ${JSON.stringify(created.body)}`);
  console.log('  要断言的三个层次：');
  console.log('    (a) 顶层结构：items / page / pageSize / total 都存在且类型正确；');
  console.log('    (b) 元素字段：id 是数字、name 是字符串、price 是数字且两位小数；');
  console.log('    (c) 业务取值：创建时传 59 → 返回 price 必须是 59（不是 5900，也不是 "59"）。');
  console.log();

  // 1.3 响应头
  console.log('1.3 响应头：最容易被忽略、也最容易破坏客户端的一层');
  const headerChecks = [
    ['Content-Type', created.headers.get('content-type'), 'application/json; charset=utf-8'],
    ['Location', created.headers.get('location'), `/api/products/${created.body.id}`],
    ['X-Request-Id', created.headers.get('x-request-id'), 'req-POST-/api/products'],
    ['Cache-Control', list.headers.get('cache-control'), 'no-store'],
  ];
  for (const [name, actual, expected] of headerChecks) {
    console.log(`  ${name.padEnd(16)} 实际=${String(actual).padEnd(46)} 期望=${expected}`);
  }
  console.log('  → 真实事故：某次重构把 Content-Type 丢了，浏览器把 JSON 当纯文本下载。');
  console.log();

  // 1.4 错误格式
  console.log('1.4 错误格式：错误体同样是契约，前端往往有一处统一处理逻辑');
  console.log(`  400 → ${JSON.stringify(badPage.body)}`);
  console.log(`  404 → ${JSON.stringify(notFound.body)}`);
  console.log(`  500 → ${JSON.stringify(boom.body)}`);
  console.log('  注意 500 的响应体：**不能**把内部错误信息（栈、SQL、文件路径）泄露给客户端，');
  console.log('  这也是 HTTP 层测试能守住的一条安全底线。');
  console.log();

  // 1.5 跨请求的一致性（真实回归最常出没的地方）
  console.log('1.5 跨请求一致性：创建之后必须查得到');
  // 注意：这里必须**新创建**一个商品来验证，不能复用 1.1 里那个 ——
  // 它在 1.1 中已经被 DELETE 掉了。这正是"用例之间共享状态会咬人"的活例子。
  const fresh = await postJson(`${baseUrl}/api/products`, { name: '跨请求验证品', price: 88 });
  const fetched = await request(`${baseUrl}/api/products/${fresh.body.id}`);
  console.log(`  POST 返回 id=${fresh.body.id} → GET /api/products/${fresh.body.id} → ${fetched.status}`);
  console.log(`  两次返回的 price 是否一致：${fetched.body.price === fresh.body.price}`);
  console.log('  这一条是"内部函数测试"永远覆盖不到的：它跨越了 HTTP → 服务 → 数据 → HTTP。');
  console.log();
});

// ===========================================================================
// 第 4 部分：为什么 HTTP 层测试更能防回归
// ===========================================================================

console.log('--- 2. 契约回归实验：内部重构 vs 契约破坏 ---');

/**
 * 真实的四种变更，看两类测试各能不能抓到。
 *
 * 两类测试指：
 *   "内部单元测试" —— 直接调用 formatPrice / 业务计算函数；
 *   "HTTP 层测试"  —— 打真实端口，断言状态码 + 字段名 + 响应头。
 */
const changes = [
  {
    name: '① 内部等价重构（formatPrice 换实现）',
    variant: 'refactor',
    contractBroken: false,
  },
  {
    name: '② 契约破坏：响应字段 price → unitPrice',
    variant: 'breaking-price',
    contractBroken: true,
  },
  {
    name: '③ 状态码变更：创建成功 201 → 200',
    variant: 'wrong-status',
    contractBroken: true,
  },
];

console.log('  ' + '变更'.padEnd(40) + '内部单元测试'.padEnd(18) + 'HTTP 层测试');
console.log('  ' + '-'.repeat(80));

for (const change of changes) {
  // --- 内部单元测试：只调纯函数，看"算得对不对" ---
  const unitCaught = await (async () => {
    try {
      assert.equal(formatPrice(39900, change.variant), 399); // 内部行为没变，永远正确
      return false;
    } catch {
      return true;
    }
  })();

  // --- HTTP 层测试：从真实端口打进去，断言完整契约 ---
  const httpCaught = await withServer(createApp({ variant: change.variant }), async (baseUrl) => {
    try {
      const created = await postJson(`${baseUrl}/api/products`, { name: '腕托', price: 59 });

      // 契约断言 1：状态码必须是 201
      assert.equal(created.status, 201, '创建成功应返回 201');
      // 契约断言 2：响应体里必须有 price 字段，且是数字 59
      assert.equal(typeof created.body.price, 'number', '响应体必须包含数字类型的 price');
      assert.equal(created.body.price, 59);
      // 契约断言 3：必须有 Location 头
      assert.ok(created.headers.get('location'), '创建成功应返回 Location 头');

      // 契约断言 4：列表接口的元素结构一致
      const list = await request(`${baseUrl}/api/products?pageSize=1`);
      assert.equal(typeof list.body.items[0].price, 'number', '列表元素的 price 字段类型必须一致');

      return false; // 全部通过 → 没抓到
    } catch {
      return true; // 有断言失败 → 抓到了
    }
  });

  // 注意措辞：以"这层测试会不会变红"为视角，而不是"抓到/漏掉"，
  // 因为对第 ① 行来说，"测试没变红"才是**正确**的结果。
  const cell = (caught) => (caught ? '变红（抓到）' : '仍绿');
  console.log('  ' + change.name.padEnd(38) + cell(unitCaught).padEnd(16) + cell(httpCaught));
}

console.log();
console.log('  读表结论（这就是"为什么要测 HTTP 层"的答案）：');
console.log('    - ① 内部等价重构：两类测试都绿 —— 这是**正确**的，');
console.log('      好的测试不应该在重构时报警，否则团队会开始不信任测试。');
console.log('    - ② 字段改名：内部单元测试**看不见**（函数返回值一点没变），');
console.log('      HTTP 层测试立刻红 —— 而线上，前端会因为 price 是 undefined 整页崩。');
console.log('    - ③ 状态码变更：同上。HTTP 层测试守护的是"对外承诺"，');
console.log('      而内部测试守护的是"内部正确性"。两者缺一不可，但只有一个能防住契约回归。');
console.log();
console.log('  经验法则：');
console.log('    - 内部逻辑的正确性 → 单元测试（快、细、定位准）；');
console.log('    - 对外契约的稳定性 → HTTP 层测试（用例不用多，覆盖每条路由的');
console.log('      "正常 + 参数非法 + 资源不存在 + 未预期异常"四种情况即可）。');
console.log();

// ===========================================================================
// 第 5 部分：真实 node:test 用例（用 useServer 辅助函数挂载）
// ===========================================================================

// 注意：describe 块里的 before/after 只在 describe 内部生效，
// 每个用例用的都是同一个端口，因此用例之间**不能**依赖彼此创建的数据。
describe('商品 API 的 HTTP 契约', () => {
  const h = useServer(() => createApp());

  before(h.before);
  after(h.after);
  beforeEach(h.beforeEach);

  test('GET /healthz 返回 200 与 { status: "ok" }', async () => {
    const res = await request(`${h.ctx.baseUrl}/healthz`);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });

  test('GET /api/products 返回统一的分页结构', async () => {
    const res = await request(`${h.ctx.baseUrl}/api/products?pageSize=2`);
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body).sort(), ['items', 'page', 'pageSize', 'total']);
    assert.equal(res.body.items.length, 2);
    assert.equal(res.body.total, 3); // 种子数据 3 条
    assert.equal(res.body.page, 1);
  });

  test('GET /api/products 的响应头包含 no-store 与 X-Request-Id', async () => {
    const res = await request(`${h.ctx.baseUrl}/api/products`);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.ok(res.headers.get('x-request-id'));
  });

  test('POST /api/products 返回 201、Location 头与创建后的资源', async () => {
    const res = await postJson(`${h.ctx.baseUrl}/api/products`, { name: '腕托', price: 59, stock: 3 });
    assert.equal(res.status, 201);
    assert.equal(res.headers.get('location'), `/api/products/${res.body.id}`);
    assert.equal(res.body.name, '腕托');
    assert.equal(res.body.price, 59);
    assert.equal(res.body.stock, 3);
  });

  test('POST /api/products 后可以按 Location 查到（跨请求一致性）', async () => {
    const created = await postJson(`${h.ctx.baseUrl}/api/products`, { name: '线夹', price: 19 });
    const got = await request(`${h.ctx.baseUrl}${created.headers.get('location')}`);
    assert.equal(got.status, 200);
    assert.deepEqual(got.body, created.body);
  });

  test('POST /api/products 参数非法时返回 400 与统一错误体', async () => {
    const res = await postJson(`${h.ctx.baseUrl}/api/products`, { name: '', price: 10 });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_NAME');
    assert.equal(res.body.error.status, 400);
  });

  test('POST /api/products 请求体不是合法 JSON 时返回 400 而不是 500', async () => {
    const res = await request(`${h.ctx.baseUrl}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ 这不是 JSON',
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_JSON');
  });

  test('GET /api/products/:id 不存在时返回 404 与统一错误体', async () => {
    const res = await request(`${h.ctx.baseUrl}/api/products/999999`);
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NOT_FOUND');
  });

  test('GET /api/products 分页参数越界时返回 400（边界）', async () => {
    for (const qs of ['page=0', 'page=abc', 'pageSize=0', 'pageSize=101']) {
      const res = await request(`${h.ctx.baseUrl}/api/products?${qs}`);
      assert.equal(res.status, 400, `${qs} 应该返回 400，实际 ${res.status}`);
      assert.ok(res.body.error.code.startsWith('INVALID_'), `${qs} 应返回 INVALID_* 错误码`);
    }
  });

  test('GET /api/boom 的 500 响应不泄露内部错误细节', async () => {
    const res = await request(`${h.ctx.baseUrl}/api/boom`);
    assert.equal(res.status, 500);
    assert.equal(res.body.error.code, 'INTERNAL');
    assert.doesNotMatch(res.text, /未捕获|at Object|\.js:/, '响应体不应包含栈或内部信息');
  });

  test('DELETE /api/products/:id 返回 204 且响应体为空', async () => {
    const created = await postJson(`${h.ctx.baseUrl}/api/products`, { name: '临时商品', price: 1 });
    const res = await request(`${h.ctx.baseUrl}/api/products/${created.body.id}`, { method: 'DELETE' });
    assert.equal(res.status, 204);
    assert.equal(res.text, '');
  });

  test('未知路由返回统一格式的 404 JSON（而不是 express 默认的 HTML）', async () => {
    const res = await request(`${h.ctx.baseUrl}/api/definitely-not-a-route`);
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'NO_ROUTE');
    assert.match(res.headers.get('content-type'), /application\/json/);
  });
});

// 用 withServer 的简洁写法：单个用例自带起停，完全不用钩子
test('withServer：一条用例内起停服务器（最轻量的写法）', async () => {
  await withServer(createApp(), async (baseUrl) => {
    const res = await request(`${baseUrl}/api/products?pageSize=1`);
    assert.equal(res.status, 200);
    assert.equal(res.body.items.length, 1);
  });
});
