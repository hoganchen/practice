/**
 * ============================================================================
 * 知识点：express —— 路由、中间件、JSON 请求体、错误处理中间件
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】进阶
 * 【前置知识】异步基础（async/await）、29_npm_libraries/04_axios.js 中的 HTTP 概念
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    express 是 Node 生态里最经典的 Web 框架。它的心智模型只有两个词：
 *      **中间件（middleware）** 与 **路由（router）**。
 *
 *    一次请求在 express 里的旅程：
 *      请求 -> 中间件1 -> 中间件2 -> ... -> 路由处理函数 -> 响应
 *    每个中间件都是一个 `(req, res, next)` 函数：
 *      - 它可以读取/修改 req（例如解析请求体、注入当前用户）；
 *      - 它可以提前结束响应（res.send / res.json）；
 *      - 它也可以调用 next() 把控制权交给下一个中间件；
 *      - 调用 next(err) 则会跳过所有普通中间件，直接进入错误处理中间件。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    真实的后端服务里，一个请求需要经过一连串处理：
 *      日志记录 -> 请求体解析 -> 鉴权 -> 限流 -> 参数校验 -> 业务逻辑 -> 统一响应格式
 *    中间件机制让这些关注点可以各自独立成一个函数，按需组合与复用。
 *    express 的极简（核心只有路由与中间件）反而让它的生态极其庞大：
 *    body-parser、cors、helmet、morgan、passport 等等都是中间件。
 *
 * 3. 核心语法要点
 *    const app = express();
 *    app.use(fn)                          全局中间件（所有请求都会经过）
 *    app.use('/api', fn)                  只对路径前缀匹配的请求生效
 *    app.use(express.json())              解析 JSON 请求体到 req.body
 *    app.get/post/put/delete(path, fn)    路由处理函数
 *    app.use((err, req, res, next) => {}) **错误处理中间件：四个参数，缺一不可**
 *    app.listen(0, () => {})              0 = 由系统分配空闲端口
 *    req.params / req.query / req.body / req.headers   四类输入来源
 *    res.status(201).json({...})          链式设置状态码并返回 JSON
 *    res.send() / res.sendStatus() / res.end()
 *    next('route') / next('router')       跳到下一个路由 / 退出当前 router
 *
 * 4. 常见陷阱
 *    - **错误处理中间件必须是四个参数**（err, req, res, next）。
 *      少一个参数 express 就会把它当成普通中间件，错误永远不会被它捕获。
 *    - **错误处理中间件必须放在所有路由之后**。express 是按注册顺序匹配的。
 *    - express 4 **不会**自动捕获 async 函数里 reject 的 Promise。
 *      `app.get('/x', async (req,res) => { throw new Error() })` 不会进入错误中间件，
 *      而是变成 unhandledRejection。必须自己包 try/catch 或写一个 asyncHandler 包装器。
 *      （express 5 已修复这一点，但升级要评估兼容性。）
 *    - express.json() 只解析 Content-Type 为 application/json 的请求体；
 *      其他类型会让 req.body 为 undefined 或 {}。
 *    - 路由顺序很重要：`/users/:id` 写在 `/users/new` 前面时，/users/new 会被前者匹配。
 *    - 忘记 res.end()：请求会一直挂起直到超时。
 *    - 忘了 server.close()：进程不会退出（句柄还开着）。
 *    - 生产环境不要在响应里暴露错误堆栈（stack），只返回错误码与友好消息。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/10_express_server.js
 *   （本文件 listen(0) 由系统分配端口，用 fetch 请求本地服务验证，
 *     验证完成后 server.close()，不访问外网，退出码 0）
 *
 * 【预期输出】
 *   打印 10 组请求的验证结果，展示路由匹配、中间件执行顺序、
 *   参数来源与错误处理，最后关闭服务器。退出码 0。
 * ============================================================================
 */

import express from 'express';
import assert from 'node:assert/strict';

// ===========================================================================
// 第 1 步：创建应用并注册中间件
// ===========================================================================

const app = express();

// ---------------------------------------------------------------------------
// 中间件 1：请求日志（自定义，真实项目里常用 morgan 之类的库）
// ---------------------------------------------------------------------------
/** 记录中间件的执行顺序，方便后面打印出来看 */
const middlewareTrace = [];

app.use((req, res, next) => {
  // 记录请求进入的时间，用于计算耗时
  req.startedAt = Date.now();
  middlewareTrace.push(`1.日志中间件 ${req.method} ${req.path}`);

  // 用 res.on('finish') 在响应结束后打印耗时 —— 这是记录访问日志的标准做法
  res.on('finish', () => {
    middlewareTrace.push(`   响应完成 ${res.statusCode} (${Date.now() - req.startedAt}ms)`);
  });

  // 必须调用 next()，否则请求会卡在这个中间件里
  next();
});

// ---------------------------------------------------------------------------
// 中间件 2：解析 JSON 请求体
// ---------------------------------------------------------------------------
// express.json() 是内置的（express 4.16+），不需要额外安装 body-parser。
// 它只会处理 Content-Type: application/json 的请求，并把结果放到 req.body。
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// 中间件 3：给响应加上统一的请求 ID（模拟链路追踪）
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  const requestId = `req-${Math.random().toString(36).slice(2, 10)}`;
  req.requestId = requestId;
  // 通过响应头返回给客户端，便于前后端一起排查问题
  res.set('X-Request-Id', requestId);
  middlewareTrace.push('2.请求ID中间件');
  next();
});

// ---------------------------------------------------------------------------
// 中间件 4：只挂在 /admin 前缀上的鉴权中间件
// ---------------------------------------------------------------------------
// app.use(路径, fn) 只对匹配该前缀的请求生效，这是"局部中间件"的用法。
app.use('/admin', (req, res, next) => {
  const token = req.headers.authorization;
  if (token !== 'Bearer admin-token') {
    // 提前结束响应：不调用 next()，后面的路由不会被匹配到
    return res.status(401).json({ error: 'unauthorized', message: '缺少或错误的管理令牌' });
  }
  req.isAdmin = true;
  next();
});

// ===========================================================================
// 第 2 步：内存数据与工具函数
// ===========================================================================

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];
let nextId = 3;

/**
 * 把异步路由处理函数包装成 express 能正确捕获错误的中间件。
 *
 * 为什么需要它：express 4 不会捕获 async 函数返回的 Promise 的拒绝。
 * 不加包装时，async 里抛错会变成 unhandledRejection，请求会一直挂起。
 * express 5 已内置该能力，但在 express 4 里这是必须的写法。
 *
 * @param {(req: any, res: any, next: any) => Promise<any>} fn
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Promise.resolve().then(fn) 保证同步抛错也会被转成 Promise 拒绝
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 业务错误：带 statusCode 的错误会被错误处理中间件识别并转成对应状态码。
 *
 * expose 字段的约定来自 http-errors 库：
 *   我们**主动构造**的错误，message 是写给调用方看的，可以安全地暴露（expose = true）；
 *   而代码里意外抛出的原生 Error（如数据库驱动报的错），
 *   message 可能包含内部细节，绝不能直接返回给客户端。
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP 状态码
   * @param {string} message 面向调用方的错误描述
   * @param {string} [code] 业务错误码
   */
  constructor(statusCode, message, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.expose = true; // 主动构造的错误，message 可以给用户看
  }
}

// ===========================================================================
// 第 3 步：路由
// ===========================================================================

console.log('--- 0. 服务器启动前的准备 ---');
console.log('  已注册的中间件（按顺序）：');
console.log('    1. 日志中间件（记录耗时）');
console.log('    2. express.json()（解析 JSON 请求体）');
console.log('    3. 请求 ID 中间件');
console.log('    4. /admin 前缀的鉴权中间件');
console.log('');

// 路由 1：最简单的 GET
app.get('/health', (req, res) => {
  // res.json() 会自动设置 Content-Type 并 JSON.stringify
  res.json({ status: 'ok', requestId: req.requestId, uptime: process.uptime() });
});

// 路由 2：带路径参数
app.get('/users/:id', (req, res) => {
  // req.params.id 永远是字符串，必须显式转数字
  const id = Number(req.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) {
    // 抛给错误处理中间件，而不是在这里手动 res.status(...).json(...)
    // 好处：错误响应的格式只需在一处维护
    throw new ApiError(404, `用户 ${id} 不存在`, 'USER_NOT_FOUND');
  }
  res.json({ data: user });
});

// 路由 3：带查询参数
app.get('/users', (req, res) => {
  const { keyword, limit } = req.query;
  let result = users;
  if (keyword) {
    result = result.filter((u) => u.name.includes(keyword));
  }
  const max = Number(limit ?? 20);
  res.json({ data: result.slice(0, max), total: result.length });
});

// 路由 4：POST + 请求体解析 + 201 状态码
app.post('/users', (req, res) => {
  // 注意：只有经过 express.json() 且有正确 Content-Type 时 req.body 才有内容
  const { name, email } = req.body ?? {};
  if (!name) {
    throw new ApiError(422, 'name 字段必填', 'VALIDATION_ERROR');
  }
  const user = { id: nextId, name, email: email ?? '' };
  nextId += 1;
  users.push(user);
  // 201 Created + Location 头是 REST 的规范做法
  res.status(201).location(`/users/${user.id}`).json({ data: user });
});

// 路由 5：异步路由（必须用 asyncHandler 包装，否则错误会丢失）
app.get('/slow', asyncHandler(async (req, res) => {
  const ms = Math.min(Number(req.query.ms ?? 10), 100);
  await new Promise((resolve) => setTimeout(resolve, ms));
  res.json({ data: `延迟 ${ms}ms 后返回` });
}));

// 路由 6：会抛错的异步路由 —— 演示 asyncHandler 的必要性
app.get('/fail-async', asyncHandler(async () => {
  // 在 express 4 里，如果没有 asyncHandler 包装，
  // 这个错误不会进入错误处理中间件，请求会挂起直到超时。
  throw new ApiError(503, '下游服务不可用', 'UPSTREAM_ERROR');
}));

// 路由 7：受保护的 /admin 路由
app.get('/admin/stats', (req, res) => {
  res.json({ data: { isAdmin: req.isAdmin === true, userCount: users.length } });
});

// 路由 8：显式 next(err) 的写法
app.get('/legacy-error', (req, res, next) => {
  // 老式回调风格里用 next(err) 传递错误，效果与 throw 相同
  next(new ApiError(400, '这是一个老的错误传递方式', 'LEGACY_ERROR'));
});

// 路由 9：路由顺序陷阱 —— 具体路径必须写在参数路径之前
// 如果把 '/users/:id' 写在前面，'/users/new' 会被它匹配到（id = "new"）。
app.get('/special/new', (req, res) => {
  res.json({ note: '这条路由必须在 /users/:id 这类参数路由之前或使用更具体的路径' });
});

// 路由 10：意外错误 —— 抛出一个"原生 Error"，演示信息脱敏
app.get('/unexpected', asyncHandler(async () => {
  // 真实项目里这类错误来自数据库驱动、文件系统、第三方 SDK……
  // 它的 message 可能包含连接串、SQL 语句、内部主机名，绝不能返回给客户端。
  throw new Error('connect ECONNREFUSED 10.0.3.17:5432 (db-internal.prod.local)');
}));

// 路由 11：405 演示 —— 为某个路径限定方法
app.route('/readonly')
  .get((req, res) => res.json({ data: '只允许 GET' }))
  .all((req, res) => {
    // .all() 会匹配该路径的所有方法；因为它注册在 .get() 之后，所以只有非 GET 会到这里
    res.status(405).json({ error: 'method_not_allowed', message: '该资源只支持 GET' });
  });

// ===========================================================================
// 第 4 步：404 与错误处理中间件（必须放在所有路由之后）
// ===========================================================================

// 404 处理：走到这里说明前面的路由都没匹配上
app.use((req, res, next) => {
  // 用 next(err) 而不是直接响应，让错误响应格式统一由错误中间件负责
  next(new ApiError(404, `找不到路由 ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
});

/**
 * 统一错误处理中间件。
 * 关键点：**必须有四个参数**，缺一个 express 就当成普通中间件，永远不会被调用。
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // 记录错误日志（真实项目里会用 winston / pino 之类的日志库）
  middlewareTrace.push(`   错误处理中间件接住：${err.message}`);

  const statusCode = err.statusCode ?? 500;

  // 安全实践：只有"主动构造、标记了 expose"的错误才把 message 返回给客户端。
  // 意外抛出的原生 Error（可能含 SQL、文件路径、内部地址）一律替换成通用文案。
  const message = err.expose === true ? err.message : '服务器内部错误，请稍后重试';

  res.status(statusCode).json({
    error: err.code ?? 'INTERNAL_ERROR',
    message,
    requestId: req.requestId,
    // 只在开发环境返回堆栈，生产环境绝不能暴露
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

// ===========================================================================
// 第 5 步：启动服务器（端口 0）并用 fetch 验证
// ===========================================================================

// listen(0)：由操作系统分配一个空闲端口，避免与本地其他服务冲突。
// 回调里用 server.address().port 拿到实际端口。
const server = app.listen(0, '127.0.0.1');

await new Promise((resolve) => server.once('listening', resolve));
const { port } = server.address();
const BASE = `http://127.0.0.1:${port}`;

console.log(`--- 1. 服务器已启动：${BASE} ---`);
console.log('');

/** 简化的请求工具：返回 { status, headers, body } */
async function request(method, path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    // fetch 需要显式指定 Content-Type，express.json() 才会解析
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: response.status, headers: response.headers, body };
}

// ---------------------------------------------------------------------------
console.log('--- 2. 基础 GET 路由 ---');
const health = await request('GET', '/health');
console.log(`  GET /health -> ${health.status}`);
console.log(`    响应体：${JSON.stringify(health.body)}`);
console.log(`    自定义响应头 X-Request-Id：${health.headers.get('x-request-id')}`);
console.log('    中间件在响应头里注入了请求 ID，业务代码完全不用关心这件事。');
console.log('');

console.log('--- 3. 路径参数 req.params ---');
const userOne = await request('GET', '/users/1');
console.log(`  GET /users/1 -> ${userOne.status} ${JSON.stringify(userOne.body)}`);
const userMissing = await request('GET', '/users/999');
console.log(`  GET /users/999 -> ${userMissing.status} ${JSON.stringify(userMissing.body)}`);
console.log('    注意：业务代码只是 throw 了一个 ApiError，状态码与响应格式由错误中间件统一处理。');
console.log('');

console.log('--- 4. 查询参数 req.query ---');
const all = await request('GET', '/users');
console.log(`  GET /users -> ${JSON.stringify(all.body)}`);
const filtered = await request('GET', '/users?keyword=B&limit=1');
console.log(`  GET /users?keyword=B&limit=1 -> ${JSON.stringify(filtered.body)}`);
console.log('    req.query 的值都是字符串，数字需要 Number() 转换。');
console.log('');

console.log('--- 5. POST + express.json() 解析请求体 ---');
const created = await request('POST', '/users', { body: { name: 'Carol', email: 'carol@example.com' } });
console.log(`  POST /users -> ${created.status} ${JSON.stringify(created.body)}`);
console.log(`    响应头 Location：${created.headers.get('location')}`);
const invalidCreate = await request('POST', '/users', { body: { email: 'no-name@example.com' } });
console.log(`  POST /users（缺 name）-> ${invalidCreate.status} ${JSON.stringify(invalidCreate.body)}`);

// 演示没有 Content-Type 时 req.body 的情况
const noContentType = await fetch(`${BASE}/users`, {
  method: 'POST',
  body: JSON.stringify({ name: 'Dave' }),
  // 故意不设置 Content-Type
});
console.log(`  POST /users（不带 Content-Type）-> ${noContentType.status} ${JSON.stringify(await noContentType.json())}`);
console.log('    express.json() 只解析 application/json，缺少该头时 req.body 会是空对象。');
console.log('');

console.log('--- 6. 异步路由与 asyncHandler ---');
const slow = await request('GET', '/slow?ms=20');
console.log(`  GET /slow?ms=20 -> ${slow.status} ${JSON.stringify(slow.body)}`);
const failAsync = await request('GET', '/fail-async');
console.log(`  GET /fail-async -> ${failAsync.status} ${JSON.stringify(failAsync.body)}`);
console.log('    异步抛错被 asyncHandler 捕获并交给了错误中间件 —— 状态码 503 正确生效。');
console.log('    如果没有 asyncHandler（express 4），这个请求会挂起直到超时。');

const unexpected = await request('GET', '/unexpected');
console.log(`  GET /unexpected -> ${unexpected.status} ${JSON.stringify(unexpected.body)}`);
console.log('    这个错误来自"意外抛出"的原生 Error，其 message 含有内部主机名与端口，');
console.log('    因此错误中间件把它替换成了通用文案 —— 这就是错误信息脱敏。');
console.log('');

console.log('--- 7. 局部中间件：/admin 鉴权 ---');
const noToken = await request('GET', '/admin/stats');
console.log(`  GET /admin/stats（无令牌）-> ${noToken.status} ${JSON.stringify(noToken.body)}`);
const withToken = await request('GET', '/admin/stats', { headers: { Authorization: 'Bearer admin-token' } });
console.log(`  GET /admin/stats（带令牌）-> ${withToken.status} ${JSON.stringify(withToken.body)}`);
console.log('    鉴权中间件只挂在 /admin 前缀上，其他路由完全不受影响。');
console.log('');

console.log('--- 8. next(err) 显式传递错误 ---');
const legacy = await request('GET', '/legacy-error');
console.log(`  GET /legacy-error -> ${legacy.status} ${JSON.stringify(legacy.body)}`);
console.log('');

console.log('--- 9. 404 与 405 ---');
const notFound = await request('GET', '/no-such-route');
console.log(`  GET /no-such-route -> ${notFound.status} ${JSON.stringify(notFound.body)}`);
const methodNotAllowed = await request('POST', '/readonly', { body: {} });
console.log(`  POST /readonly -> ${methodNotAllowed.status} ${JSON.stringify(methodNotAllowed.body)}`);
console.log('    404 也是通过 next(new ApiError(...)) 产生的，保证所有错误响应格式一致。');
console.log('');

console.log('--- 10. 关于错误处理中间件的一个关键细节 ---');
console.log('  如果把错误中间件写成三个参数：');
console.log('    app.use((err, req, res) => {...})     // ❌ 少了 next');
console.log('  express 会把它当成普通中间件（err 其实是 req），永远不会被错误触发。');
console.log('  必须写满四个参数，哪怕 next 用不到也要保留：');
console.log('    app.use((err, req, res, next) => {...})  // ✅');
console.log('  这也是为什么很多项目在这个参数上写 // eslint-disable-line no-unused-vars。');
console.log('');

console.log('--- 11. 中间件执行轨迹（来自日志中间件的记录）---');
for (const line of middlewareTrace) console.log(`  ${line}`);
console.log('');
console.log(`  可以看到每个请求都依次经过：日志 -> json 解析 -> 请求 ID -> (可能的鉴权) -> 路由`);
console.log('  出错时则在路由之后进入错误处理中间件 —— 这正是"洋葱模型"的执行顺序。');
console.log('');

// ===========================================================================
// 第 6 步：断言与关闭服务器
// ===========================================================================
console.log('--- 12. 自测断言 ---');

assert.strictEqual(health.status, 200);
assert.strictEqual(health.body.status, 'ok');
assert.ok(health.headers.get('x-request-id'), '应注入 X-Request-Id 响应头');
assert.strictEqual(userOne.status, 200);
assert.strictEqual(userOne.body.data.name, 'Alice');
assert.strictEqual(userMissing.status, 404);
assert.strictEqual(userMissing.body.error, 'USER_NOT_FOUND');
assert.strictEqual(all.body.total >= 2, true);
assert.deepStrictEqual(filtered.body.data.map((u) => u.name), ['Bob']);
assert.strictEqual(created.status, 201);
assert.strictEqual(created.body.data.name, 'Carol');
assert.strictEqual(created.headers.get('location'), `/users/${created.body.data.id}`);
assert.strictEqual(invalidCreate.status, 422);
assert.strictEqual(invalidCreate.body.error, 'VALIDATION_ERROR');
assert.strictEqual(failAsync.status, 503);
assert.strictEqual(failAsync.body.message, '下游服务不可用', '主动构造的错误 message 应原样返回');
assert.strictEqual(unexpected.status, 500);
assert.strictEqual(unexpected.body.message, '服务器内部错误，请稍后重试', '意外错误的细节不应暴露');
assert.strictEqual(unexpected.body.message.includes('10.0.3.17'), false, '内部地址绝不能泄漏');
assert.strictEqual(noToken.status, 401);
assert.strictEqual(withToken.status, 200);
assert.strictEqual(withToken.body.data.isAdmin, true);
assert.strictEqual(legacy.status, 400);
assert.strictEqual(notFound.status, 404);
assert.strictEqual(notFound.body.error, 'ROUTE_NOT_FOUND');
assert.strictEqual(methodNotAllowed.status, 405);
console.log('  全部断言通过。');
console.log('');

// server.close() 停止接收新连接并等待已有连接结束。
// 必须 await，否则进程可能因为句柄未释放而挂住。
await new Promise((resolve) => server.close(resolve));
console.log(`--- 13. 服务器已关闭：server.listening = ${server.listening} ---`);
console.log('');
console.log('--- 14. 生产环境还需要哪些中间件 ---');
console.log('  cors        跨域（浏览器同源策略要求服务端显式允许）');
console.log('  helmet      设置一批安全响应头（CSP / X-Frame-Options 等）');
console.log('  morgan      标准访问日志');
console.log('  compression gzip 压缩响应体');
console.log('  express-rate-limit  限流，防止暴力破解与爬虫');
console.log('  express-session / passport 会话与鉴权');
console.log('  multer      处理 multipart/form-data（文件上传）');
console.log('');
console.log('演示结束。');
