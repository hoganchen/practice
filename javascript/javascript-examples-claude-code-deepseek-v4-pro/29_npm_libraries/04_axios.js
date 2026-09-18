/**
 * ============================================================================
 * 知识点：axios —— GET/POST、实例配置、拦截器、错误处理
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】进阶
 * 【前置知识】异步基础（Promise / async-await）、Node 的 http 模块基本概念
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    axios 是最流行的 HTTP 客户端库，浏览器与 Node 通用。
 *    它是 fetch 的"电池已装好"版本：
 *      - 自动把请求体/响应体按 JSON 序列化与反序列化（不用手写 JSON.parse）；
 *      - 非 2xx 状态码自动 reject（不用手写 if (!res.ok) throw）；
 *      - 支持请求超时、取消、进度、拦截器、实例化配置；
 *      - 浏览器里基于 XMLHttpRequest，Node 里基于 http/https 模块。
 *
 *    核心概念：
 *      实例（instance）：axios.create({ baseURL, timeout, headers }) 创建一个
 *                        带默认配置的"专用客户端"。真实项目里通常为每个后端服务
 *                        创建一个实例，避免每次请求都重复写 baseURL 和 token。
 *      拦截器（interceptor）：请求发出前 / 响应返回后的统一加工管道。
 *                        是"自动带 token""统一错误提示""统一 loading 状态"的实现位置。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    真实项目的网络层通常长这样：
 *      - 创建一个 api.js，用 axios.create 配置 baseURL、超时、默认请求头；
 *      - 请求拦截器里从本地存储读 token 塞进 Authorization 头，
 *        并给每个请求加一个 requestId 便于链路追踪；
 *      - 响应拦截器里统一处理 401（跳登录）、统一解包 data、
 *        统一把后端错误码转成前端可用的 Error 对象；
 *      - 业务代码里只写 `api.get('/users')`，不用关心这些细节。
 *
 * 3. 核心语法要点
 *    axios.get(url, { params, headers, timeout })
 *    axios.post(url, body, { headers })
 *    axios({ method, url, data, params })           统一写法（适合封装）
 *    axios.create({ baseURL, timeout, headers })    创建实例
 *    instance.interceptors.request.use(onFulfilled, onRejected)
 *    instance.interceptors.response.use(onFulfilled, onRejected)
 *    axios.isAxiosError(err)                        判断是否为 axios 错误
 *    err.response / err.request / err.config / err.code  错误对象的关键字段
 *    err.message                                     "timeout of 50ms exceeded" 等
 *    validateStatus: (status) => status < 500       自定义"什么算成功"
 *    signal: AbortController.signal                 取消请求（axios 1.x 推荐方式）
 *
 * 4. 常见陷阱
 *    - 拦截器是"全局状态"：给实例 addInterceptor 后忘记 eject，
 *      多次调用会重复叠加，导致同一个请求被处理多次。
 *    - 响应拦截器里 return 什么，业务代码就拿到什么。很多人在这里 return res.data，
 *      结果 `await api.get()` 拿到的是 data 而不是完整响应 —— 要团队统一约定。
 *    - 忘记处理网络错误：err.response 只在"服务器有响应"时存在。
 *      网络不可达、超时、DNS 失败时 err.response 是 undefined，
 *      直接读 err.response.status 会再抛一个 TypeError。
 *    - 超时时间单位是毫秒，且默认值是 0（不超时）—— 生产环境必须显式设置。
 *    - POST 传 undefined 时不会带 body，某些后端会因此报 400。
 *    - Node 里 axios 用的是自己的 http 适配器，不走浏览器的同源策略；
 *      浏览器里才涉及 CORS，且 CORS 是浏览器行为，axios 无法绕过。
 *    - 不要忘了 close 服务器：本文件演示完会 server.close()，否则进程不退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/04_axios.js
 *   （本文件会在本地 127.0.0.1 的随机端口上自建 HTTP 服务器，
 *     不访问任何外网；演示结束后会关闭服务器，进程正常退出）
 *
 * 【预期输出】
 *   打印 8 组 axios 用法的请求与响应详情，最后打印服务器关闭信息。退出码 0。
 * ============================================================================
 */

import http from 'node:http';
import axios from 'axios';
import assert from 'node:assert/strict';

// ===========================================================================
// 第 0 步：用 node:http 自建一个本地测试服务器（不访问外网）
// ===========================================================================

/** 内存中的"数据库"，用于演示 POST 与 GET 的配合 */
const users = [
  { id: 1, name: 'Alice', dept: '研发' },
  { id: 2, name: 'Bob', dept: '市场' },
  { id: 3, name: 'Carol', dept: '研发' },
];

/** 读取请求体（Node 的 http 模块需要手动拼接数据流） */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/** 统一的 JSON 响应工具 */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  // 用 URL 解析出路径与查询参数
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  // --- 路由 1：GET /api/users?dept=研发 ---
  if (req.method === 'GET' && path === '/api/users') {
    const dept = url.searchParams.get('dept'); // 演示 params 选项
    const result = dept ? users.filter((u) => u.dept === dept) : users;
    sendJson(res, 200, { code: 0, data: result, total: result.length });
    return;
  }

  // --- 路由 2：GET /api/users/:id ---
  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (req.method === 'GET' && userMatch) {
    const id = Number(userMatch[1]);
    const user = users.find((u) => u.id === id);
    if (!user) {
      sendJson(res, 404, { code: 40401, message: `用户 ${id} 不存在` });
      return;
    }
    sendJson(res, 200, { code: 0, data: user });
    return;
  }

  // --- 路由 3：POST /api/users（演示请求体与 201 状态码）---
  if (req.method === 'POST' && path === '/api/users') {
    const raw = await readBody(req);
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      sendJson(res, 400, { code: 40001, message: '请求体不是合法 JSON' });
      return;
    }
    if (!payload.name) {
      sendJson(res, 422, { code: 42201, message: 'name 字段必填' });
      return;
    }
    const created = { id: users.length + 1, name: payload.name, dept: payload.dept ?? '未分配' };
    users.push(created);
    sendJson(res, 201, { code: 0, data: created });
    return;
  }

  // --- 路由 4：GET /api/echo-headers（演示自定义请求头）---
  if (req.method === 'GET' && path === '/api/echo-headers') {
    sendJson(res, 200, {
      code: 0,
      data: {
        authorization: req.headers.authorization ?? null,
        'x-request-id': req.headers['x-request-id'] ?? null,
        'x-custom': req.headers['x-custom'] ?? null,
      },
    });
    return;
  }

  // --- 路由 5：GET /api/error/500（演示服务端错误）---
  if (req.method === 'GET' && path === '/api/error/500') {
    sendJson(res, 500, { code: 50000, message: '服务器内部错误：数据库连接失败' });
    return;
  }

  // --- 路由 6：GET /api/error/401（演示鉴权失败）---
  if (req.method === 'GET' && path === '/api/error/401') {
    sendJson(res, 401, { code: 40100, message: '登录已过期，请重新登录' });
    return;
  }

  // --- 路由 7：GET /api/slow?ms=300（演示超时控制）---
  if (req.method === 'GET' && path === '/api/slow') {
    const ms = Number(url.searchParams.get('ms') ?? 100);
    // 故意延迟响应，用来触发客户端超时
    await new Promise((resolve) => setTimeout(resolve, ms));
    sendJson(res, 200, { code: 0, data: `延迟了 ${ms}ms 才返回` });
    return;
  }

  // --- 路由 8：GET /api/redirect（演示 axios 默认跟随重定向）---
  if (req.method === 'GET' && path === '/api/redirect') {
    res.writeHead(302, { Location: '/api/users/1' });
    res.end();
    return;
  }

  // --- 兜底：404 ---
  sendJson(res, 404, { code: 40400, message: `未知路由 ${req.method} ${path}` });
});

// listen(0) 让操作系统分配一个空闲端口，避免与本地其他服务冲突。
// 这是测试与示例代码的最佳实践：不要写死端口号。
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const BASE_URL = `http://127.0.0.1:${port}`;

console.log('--- 0. 本地测试服务器已启动 ---');
console.log(`  监听地址：${BASE_URL}（端口 0 = 由系统分配空闲端口）`);
console.log(`  Node 版本：${process.version}，axios 版本：${axios.VERSION}`);
console.log('');

// ===========================================================================
// 1. GET 请求
// ===========================================================================
console.log('--- 1. GET 请求：axios.get() ---');

const listResponse = await axios.get(`${BASE_URL}/api/users`);
console.log(`  状态码：${listResponse.status} ${listResponse.statusText}`);
console.log(`  响应数据（axios 已自动 JSON.parse）：${JSON.stringify(listResponse.data)}`);
console.log(`  axios 把响应包装成对象，业务数据在 .data 里，而不是直接返回 body。`);
// 其他的响应信息
console.log(`  响应头 content-type：${listResponse.headers['content-type']}`);
console.log(`  最终请求地址：${listResponse.config.url}`);
console.log(`  实际发出的完整 URL：${listResponse.request.res.responseUrl ?? '(见 config)'}`);

// params 选项：自动把对象拼成查询字符串，并处理特殊字符的编码
const filtered = await axios.get(`${BASE_URL}/api/users`, { params: { dept: '研发' } });
console.log('');
console.log(`  用 params 传查询参数：{ dept: '研发' } -> ${JSON.stringify(filtered.data.data.map((u) => u.name))}`);
console.log('  好处：axios 会自动 encodeURIComponent，不用手写 ?a=1&b=2 的拼接与转义。');

// 路径参数直接拼在 URL 里
const one = await axios.get(`${BASE_URL}/api/users/2`);
console.log(`  GET /api/users/2 -> ${JSON.stringify(one.data.data)}`);
console.log('');

// ===========================================================================
// 2. POST 请求
// ===========================================================================
console.log('--- 2. POST 请求：axios.post() ---');

const createResponse = await axios.post(`${BASE_URL}/api/users`, {
  name: 'Dave',
  dept: '财务',
});
console.log(`  状态码：${createResponse.status}（201 Created）`);
console.log(`  服务端返回：${JSON.stringify(createResponse.data)}`);
console.log(`  axios 会自动把对象序列化成 JSON，并设置 Content-Type: application/json —— 不需要手写 JSON.stringify。`);
console.log(`  实际发送的请求头 content-type：${createResponse.config.headers['Content-Type']}`);

// 用刚创建的 id 验证一下确实写进去了
const verify = await axios.get(`${BASE_URL}/api/users/${createResponse.data.data.id}`);
console.log(`  验证：GET /api/users/${createResponse.data.data.id} -> ${JSON.stringify(verify.data.data)}`);

// 演示服务端返回 400/422 这类"客户端错误"时 axios 会抛异常
try {
  await axios.post(`${BASE_URL}/api/users`, { dept: '缺少 name 字段' });
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.log('');
    console.log(`  提交缺少必填字段时 axios 抛出错误：`);
    console.log(`    isAxiosError = true`);
    console.log(`    error.response.status = ${error.response.status}（422 Unprocessable Entity）`);
    console.log(`    error.response.data = ${JSON.stringify(error.response.data)}`);
    console.log(`    对比 fetch：fetch 不会因为 4xx/5xx 而 reject，必须手写 if (!res.ok) 判断。`);
  }
}
console.log('');

// ===========================================================================
// 3. 实例配置：axios.create()
// ===========================================================================
console.log('--- 3. 实例配置：axios.create() ---');

// 真实项目里为每个后端服务建一个实例，把公共配置集中管理。
const api = axios.create({
  baseURL: `${BASE_URL}/api`, // 所有请求自动加前缀
  timeout: 2000, // 超时（毫秒）—— 生产环境必须设置
  headers: {
    'X-Custom': 'from-instance', // 实例级默认请求头
  },
});

const instResponse = await api.get('/users/1');
console.log(`  api.get('/users/1') 实际请求的地址：${instResponse.config.url}（baseURL 自动拼接）`);
console.log(`  实例级请求头 X-Custom 已带上：${JSON.stringify(instResponse.config.headers['X-Custom'])}`);

// 单次请求可以覆盖实例配置
const overrideResponse = await api.get('/users/1', {
  headers: { 'X-Custom': 'per-request-override' },
  timeout: 5000,
});
console.log(`  单次请求覆盖请求头：${overrideResponse.config.headers['X-Custom']}`);

// 实例上的方法可以解构出来用，但注意 baseURL 依赖实例上下文
const { get: apiGet, post: apiPost } = api;
const destructured = await apiGet('/users');
console.log(`  解构出的 apiGet('/users') 也正常工作，返回 ${destructured.data.total} 条数据`);
console.log('  注意：解构后方法仍然绑定在实例上（axios 内部做了绑定），可以放心解构。');
console.log('');

// ===========================================================================
// 4. 拦截器
// ===========================================================================
console.log('--- 4. 拦截器：请求前 / 响应后的统一加工 ---');

/** 模拟本地存储里的登录态（真实项目里是 localStorage / AsyncStorage） */
let authToken = 'token-abc-123';

// 请求拦截器：在请求发出前统一加工 config
const requestInterceptorId = api.interceptors.request.use(
  (config) => {
    // 1) 自动带上鉴权头 —— 这是拦截器最经典的用途
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    // 2) 给每个请求加一个唯一的追踪 id（后端日志排查靠它）
    config.headers['X-Request-Id'] = `req-${Date.now().toString(36)}`;
    console.log(`    [请求拦截器] ${config.method.toUpperCase()} ${config.url}`);
    // 必须 return config，否则请求会带着 undefined 发出去
    return config;
  },
  (error) => {
    // 请求配置本身出错（极少见）时走这里
    console.log(`    [请求拦截器] 出错：${error.message}`);
    return Promise.reject(error);
  },
);

// 响应拦截器：在业务代码拿到响应前统一加工
let responseLog = [];
const responseInterceptorId = api.interceptors.response.use(
  (response) => {
    responseLog.push(`成功 ${response.status}`);
    console.log(`    [响应拦截器] ${response.status} ${response.config.url}`);
    // 注意：拦截器 return 什么，业务代码就拿到什么。
    // 这里保持返回完整 response，让业务代码自己取 .data（团队要统一约定！）
    return response;
  },
  (error) => {
    responseLog.push(`失败 ${error.response?.status ?? 'network'}`);
    console.log(`    [响应拦截器] 失败：${error.message}`);
    // 不 return Promise.reject 而 return 一个值的话，错误就被"吞掉"了
    return Promise.reject(error);
  },
);

const echoed = await api.get('/echo-headers');
console.log(`  服务端收到的 Authorization：${echoed.data.data.authorization}`);
console.log(`  服务端收到的 X-Request-Id：${echoed.data.data['x-request-id']}`);
console.log(`  业务代码里完全没有写 token，它由拦截器统一注入 —— 这就是拦截器的价值。`);

// 拦截器也会捕获失败响应
try {
  await api.get('/error/500');
} catch (error) {
  console.log(`  业务代码捕获到 500 错误：${error.response.data.message}`);
}
console.log(`  响应拦截器的处理日志：${JSON.stringify(responseLog)}`);

// 重要：拦截器是全局状态，用完要 eject，否则会一直叠加
api.interceptors.request.eject(requestInterceptorId);
api.interceptors.response.eject(responseInterceptorId);
console.log('');
console.log('  api.interceptors.request.eject(id) 已移除两个拦截器。');
console.log('  陷阱：如果多次调用 use() 而从不 eject()，拦截器会不断叠加，');
console.log('        同一个请求会被处理 N 次（例如带上 N 个 Authorization 头）。');
console.log('');

// ===========================================================================
// 5. 错误处理：区分"有响应"与"无响应"
// ===========================================================================
console.log('--- 5. 错误处理：axios 错误对象的完整结构 ---');

// 场景 A：服务器返回了 4xx/5xx —— 有 error.response
try {
  await axios.get(`${BASE_URL}/api/error/401`);
} catch (error) {
  console.log('  场景 A：服务端返回 401');
  console.log(`    axios.isAxiosError(error) = ${axios.isAxiosError(error)}`);
  console.log(`    error.response.status    = ${error.response.status}`);
  console.log(`    error.response.data      = ${JSON.stringify(error.response.data)}`);
  console.log(`    error.config.url         = ${error.config.url}（可以拿到原始请求配置）`);
  console.log(`    error.message            = "${error.message}"`);
}

// 场景 B：请求超时 —— 没有 error.response，但有 error.code = ECONNABORTED
try {
  await axios.get(`${BASE_URL}/api/slow`, { params: { ms: 500 }, timeout: 50 });
} catch (error) {
  console.log('');
  console.log('  场景 B：请求超时');
  console.log(`    error.code        = ${error.code}（超时的标志）`);
  console.log(`    error.message     = "${error.message}"`);
  console.log(`    error.response    = ${String(error.response)}（超时时没有响应对象！）`);
  console.log('    -> 所以千万不能直接写 error.response.status，会再抛一个 TypeError。');
}

// 场景 C：连接失败（端口无人监听）—— 同样没有 response
try {
  // 用一个几乎肯定没人监听的端口
  await axios.get('http://127.0.0.1:1/nothing', { timeout: 500 });
} catch (error) {
  console.log('');
  console.log('  场景 C：连接被拒绝');
  console.log(`    error.code     = ${error.code}（ECONNREFUSED = 服务器不可达）`);
  console.log(`    error.response = ${String(error.response)}`);
}

// 一个实用的错误归一化函数 —— 真实项目网络层里几乎一定会有
/**
 * 把 axios 的各种错误形态统一成一个 { status, code, message } 结构，
 * 便于上层 UI 统一展示，不用到处判断 error.response 存不存在。
 * @param {unknown} error
 */
function normalizeApiError(error) {
  if (!axios.isAxiosError(error)) {
    return { status: 0, code: 'UNKNOWN', message: error instanceof Error ? error.message : String(error) };
  }
  if (error.code === 'ECONNABORTED') {
    return { status: 0, code: 'TIMEOUT', message: '请求超时，请检查网络后重试' };
  }
  if (error.response) {
    // 服务器有响应：优先用后端返回的 message
    return {
      status: error.response.status,
      code: error.response.data?.code ?? 'HTTP_ERROR',
      message: error.response.data?.message ?? `请求失败（${error.response.status}）`,
    };
  }
  // 无响应：网络层问题
  return { status: 0, code: error.code ?? 'NETWORK', message: '网络异常，请稍后重试' };
}

console.log('');
console.log('  用归一化函数统一处理三种错误：');
const errorCases = [
  ['401 响应', () => axios.get(`${BASE_URL}/api/error/401`)],
  ['请求超时', () => axios.get(`${BASE_URL}/api/slow`, { params: { ms: 500 }, timeout: 50 })],
  ['连接拒绝', () => axios.get('http://127.0.0.1:1/x', { timeout: 300 })],
];
for (const [label, request] of errorCases) {
  const normalized = await request().catch((e) => normalizeApiError(e));
  console.log(`    ${label.padEnd(10)} -> status=${normalized.status} code=${normalized.code} message="${normalized.message}"`);
}
console.log('');

// ===========================================================================
// 6. validateStatus：自定义"什么算成功"
// ===========================================================================
console.log('--- 6. validateStatus：自定义成功判定 ---');

// 默认 axios 认为只有 2xx 是成功。有些团队希望 4xx 也走 then 分支自己处理。
const lenient = axios.create({
  baseURL: BASE_URL,
  // 只有在 500 及以上才 reject —— 4xx 交给业务代码用 data.code 判断
  validateStatus: (status) => status < 500,
});
const lenientResponse = await lenient.get('/api/error/401');
console.log(`  自定义 validateStatus: (s) => s < 500`);
console.log(`  请求 401 的结果：status=${lenientResponse.status}，走的是 then 分支而不是 catch`);
console.log(`  响应体：${JSON.stringify(lenientResponse.data)}`);
console.log('  适用场景：后端用 HTTP 200 + body.code 表达业务错误时，或希望统一在 then 里分发。');
console.log('');

// ===========================================================================
// 7. 并发请求与取消
// ===========================================================================
console.log('--- 7. 并发与取消 ---');

const t0 = Date.now();
// Promise.all：并发发出，全部成功才成功；任何一个失败就整体失败（fail-fast）
const [r1, r2, r3] = await Promise.all([
  axios.get(`${BASE_URL}/api/slow`, { params: { ms: 60 } }),
  axios.get(`${BASE_URL}/api/slow`, { params: { ms: 60 } }),
  axios.get(`${BASE_URL}/api/slow`, { params: { ms: 60 } }),
]);
console.log(`  3 个各耗时 60ms 的请求并发执行，总耗时 ${Date.now() - t0}ms（接近 60ms 而不是 180ms）`);
console.log(`  三个响应：${[r1, r2, r3].map((r) => r.data.data).join(' | ')}`);

// allSettled 风格的容错写法：不关心某个请求失败
const settled = await Promise.allSettled([
  axios.get(`${BASE_URL}/api/users/1`),
  axios.get(`${BASE_URL}/api/error/500`),
  axios.get(`${BASE_URL}/api/users/3`),
]);
console.log(`  Promise.allSettled 的结果状态：${settled.map((s) => s.status).join(', ')}`);
console.log('    局部失败不影响其他请求 —— 首页并行加载多个模块时用这个更稳妥。');

// AbortController 取消请求（axios 1.x 的推荐方式，与 fetch 一致）
console.log('');
const controller = new AbortController();
const cancelPromise = axios.get(`${BASE_URL}/api/slow`, { params: { ms: 500 }, signal: controller.signal });
// 20ms 后主动取消
setTimeout(() => controller.abort(), 20);
try {
  await cancelPromise;
} catch (error) {
  console.log(`  用 AbortController 取消请求 -> error.code = ${error.code}，message = "${error.message}"`);
  console.log('  真实场景：用户切换页面/输入新关键词时，取消上一个还没返回的请求，避免结果乱序。');
}
console.log('');

// ===========================================================================
// 8. 重定向
// ===========================================================================
console.log('--- 8. 重定向 ---');
const redirected = await axios.get(`${BASE_URL}/api/redirect`);
console.log(`  GET /api/redirect 返回 302，axios 默认自动跟随到底：`);
console.log(`    最终状态码：${redirected.status}，数据：${JSON.stringify(redirected.data.data)}`);
console.log(`    也可以通过 maxRedirects: 0 禁止跟随（此时会得到 302 响应本身）。`);
console.log('');

// ===========================================================================
// 9. fetch vs axios 对照
// ===========================================================================
console.log('--- 9. axios 与原生 fetch 对照 ---');
const comparison = [
  ['JSON 序列化', '自动（传对象即可）', '手动 JSON.stringify'],
  ['JSON 解析', '自动（res.data）', '手动 await res.json()'],
  ['4xx/5xx 处理', '自动 reject', '需手写 if (!res.ok) throw'],
  ['超时控制', 'timeout 选项', 'AbortSignal.timeout(ms)'],
  ['拦截器', '内置', '需自己包一层函数'],
  ['上传/下载进度', '内置 onUploadProgress', '需要 ReadableStream 手动实现'],
  ['包体积', '约 13KB gzip', '0（内置）'],
  ['Node 支持', '内置适配器', 'Node 18+ 内置'],
];
for (const [aspect, axiosWay, fetchWay] of comparison) {
  console.log(`  ${aspect.padEnd(16)} axios: ${axiosWay.padEnd(24)} fetch: ${fetchWay}`);
}
console.log('');
console.log('  选型建议：');
console.log('    - 需要拦截器、进度、取消、统一错误处理的中大型项目 -> axios 省事；');
console.log('    - 只发几个请求、追求零依赖 -> fetch 完全够用。');
console.log('');

// ===========================================================================
// 10. 关闭服务器
// ===========================================================================
console.log('--- 10. 清理：关闭本地服务器 ---');

// 演示用的内存数据在 POST 后已经变化，这里顺便验证一下响应确实是我们服务器发出的
assert.strictEqual(listResponse.status, 200);
assert.strictEqual(listResponse.data.total, 3);
assert.strictEqual(one.data.data.name, 'Bob');
assert.strictEqual(createResponse.status, 201);
assert.strictEqual(createResponse.data.data.name, 'Dave');
assert.strictEqual(echoed.data.data.authorization, 'Bearer token-abc-123');
assert.strictEqual(lenientResponse.status, 401);
assert.strictEqual(redirected.status, 200);
assert.strictEqual(settled.filter((s) => s.status === 'fulfilled').length, 2);
console.log('  断言全部通过。');

// server.close() 停止接收新连接，并等待已有连接结束后触发回调。
// 必须 await，否则进程可能在关闭完成前退出（或者因为句柄未释放而挂住）。
await new Promise((resolve) => server.close(resolve));
console.log(`  服务器已关闭：server.listening = ${server.listening}`);
console.log('');
console.log('演示结束。');
