/**
 * ============================================================================
 * 知识点：网络请求 fetch（Node 端自建本地服务器 + 用 fetch 请求自己）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/03_forms_and_validation.js、21_json（JSON 序列化）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    fetch 是现代浏览器提供的网络请求 API，用来向服务器发 HTTP 请求并读取响应。
 *    它基于 Promise，取代了老旧的 XMLHttpRequest（XHR）。
 *    Node.js 从 18 版开始也内置了全局 fetch，用法与浏览器几乎一致。
 *
 * 2. 为什么需要
 *    前端页面本身只有 HTML/CSS/JS，数据要靠 AJAX/Fetch 从服务器取。
 *    动态加载列表、提交表单、上传文件、调用第三方接口，全都靠它。
 *    fetch 的 Promise 风格让"请求 → 解析 → 更新界面"这条链路可以用
 *    async/await 写成近乎同步的代码，比 XHR 的回调地狱清晰得多。
 *
 * 3. 核心语法要点
 *    - fetch(url, options) → Promise<Response>
 *        options: { method, headers, body, signal, credentials, mode, cache }
 *    - Response 对象：
 *        response.ok      → 状态码在 200-299 之间时为 true
 *        response.status  → 200 / 404 / 500 ...
 *        response.headers → Headers 对象，用 get('content-type') 取
 *        response.json() / .text() / .blob() / .arrayBuffer() → 都是 Promise
 *    - 请求体：body 可以是字符串（通常 JSON.stringify）、FormData、Blob、URLSearchParams。
 *      发 JSON 时记得带 headers: { 'Content-Type': 'application/json' }。
 *    - 取消请求：AbortController + signal。controller.abort() 会让 fetch 以
 *      AbortError 拒绝。常用来做"超时"和"用户离开页面时取消"。
 *    - 查询参数：用 new URLSearchParams({...}) 拼接，别手写字符串拼接（要转义）。
 *    - 并发：Promise.all([fetch(a), fetch(b)])。
 *
 * 4. 常见陷阱
 *    - fetch 只在"网络层失败"时 reject；HTTP 404/500 属于"成功拿到响应"，
 *      Promise 依然是 fulfilled！必须自己检查 response.ok。
 *    - Response 的 body 是"一次性"的流：json() 读过一次后就不能再 text() 了，
 *      会抛 "Body has already been read"。
 *    - CORS：浏览器里跨域请求会被同源策略限制，需要服务端返回
 *      Access-Control-Allow-Origin。Node 里没有同源策略，所以不会有这个问题。
 *    - 忘记 await response.json()（它是 Promise，不是对象本身）。
 *    - 用 fetch 发 POST 时，如果不设 Content-Type，服务端可能按
 *      application/x-www-form-urlencoded 解析，导致拿不到 JSON。
 *    - 请求超时 fetch 自己不支持，必须用 AbortController 手工实现。
 *
 * 【本文件在 Node 中如何演示】
 *    本文件用 node:http 起一个本地 HTTP 服务器（端口写 0，由系统随机分配），
 *    然后让 fetch 去请求这个服务器自己。这样既不需要外网，又完整演示了
 *    GET / POST / 404 / 500 / 超时取消 / 并发请求 等真实场景。
 *    浏览器里的 fetch 与这里的 fetch 是同一套 API（Node 内置的 undici 实现）。
 *
 * 【运行方法】
 *   node 27_web_apis/04_fetch_api.js
 *
 * 【预期输出】
 *   依次打印每个请求的 URL、状态码、响应头、解析后的数据，
 *   以及 404、500、网络错误、超时取消的捕获过程，最后关闭服务器正常退出。
 * ============================================================================
 */

import http from 'node:http';

// ===========================================================================
// 第 1 部分：起一个本地 HTTP 服务器当作"后端"
// ===========================================================================

console.log('--- 1. 用 node:http 起一个本地服务器（端口 0 = 由系统分配） ---');

/** 内存里的假数据库 */
const users = [
  { id: 1, name: '小明', age: 18 },
  { id: 2, name: '小红', age: 19 },
  { id: 3, name: '小刚', age: 17 },
];

/** 读取请求体（POST 的数据通过流式传输过来，要自己收集） */
function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk)); // 数据分片到达就追加
    req.on('end', () => resolve(raw)); // 全部收完
  });
}

/** 统一的 JSON 响应工具 */
function sendJson(res, status, data, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // req.url 是"路径 + 查询字符串"，用 WHATWG URL 解析最省事
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  console.log(`    [服务器] 收到请求 ${req.method} ${req.url}`);

  // 路由 1：GET /api/users —— 返回用户列表，支持 ?limit=n 限制条数
  if (req.method === 'GET' && path === '/api/users') {
    const limit = Number(url.searchParams.get('limit') ?? users.length);
    return sendJson(res, 200, { total: users.length, items: users.slice(0, limit) });
  }

  // 路由 2：GET /api/users/:id —— 演示 404 是怎么产生的
  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (req.method === 'GET' && userMatch) {
    const id = Number(userMatch[1]);
    const user = users.find((u) => u.id === id);
    if (!user) return sendJson(res, 404, { error: 'UserNotFound', message: `没有 id=${id} 的用户` });
    return sendJson(res, 200, user);
  }

  // 路由 3：POST /api/users —— 接收 JSON，返回 201
  if (req.method === 'POST' && path === '/api/users') {
    const raw = await readBody(req);
    let payload;
    try {
      payload = JSON.parse(raw); // 请求体是字符串，要自己反序列化
    } catch {
      return sendJson(res, 400, { error: 'BadRequest', message: '请求体不是合法 JSON' });
    }
    const created = { id: users.length + 1, ...payload };
    users.push(created);
    return sendJson(res, 201, created, { Location: `/api/users/${created.id}` });
  }

  // 路由 4：GET /api/slow —— 故意慢 400ms，用于演示"超时取消"
  if (req.method === 'GET' && path === '/api/slow') {
    await new Promise((r) => setTimeout(r, 400));
    return sendJson(res, 200, { message: '我虽然慢，但还是回来了' });
  }

  // 路由 5：GET /api/error —— 故意返回 500，用于演示"HTTP 错误不等于网络错误"
  if (req.method === 'GET' && path === '/api/error') {
    return sendJson(res, 500, { error: 'InternalServerError', message: '服务器内部错误（这是故意的）' });
  }

  // 兜底：没匹配到任何路由
  return sendJson(res, 404, { error: 'NotFound', message: '没有这个接口：' + path });
});

// listen(0) 让操作系统随机分配一个空闲端口，避免和别的程序打架
const port = await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const BASE = `http://127.0.0.1:${port}`;
console.log('服务器已启动：', BASE);
console.log('（端口写 0 表示由系统随机分配，这样脚本在任何机器上都能跑起来。）');
console.log('');

// ===========================================================================
// 第 2 部分：最基本的 GET 请求
// ===========================================================================

console.log('--- 2. 基本 GET：fetch 返回的是 Promise<Response> ---');

{
  const response = await fetch(`${BASE}/api/users`);
  // 注意：上面只有"网络层失败"才会抛错。HTTP 404/500 也算"成功拿到响应"。
  console.log('  response.ok      =', response.ok, '（状态码 200-299 才为 true）');
  console.log('  response.status  =', response.status);
  console.log('  response.statusText =', JSON.stringify(response.statusText));
  console.log('  content-type     =', response.headers.get('content-type'));
  console.log('  响应是流式的，response.body 是 ReadableStream：', response.body instanceof ReadableStream);

  // json() 把响应体解析成 JS 对象，它本身也是 Promise，必须 await
  const data = await response.json();
  console.log('  解析后的数据：total =', data.total, '，第一条 =', data.items[0].name);
}
console.log('');

// ===========================================================================
// 第 3 部分：查询参数用 URLSearchParams
// ===========================================================================

console.log('--- 3. 查询参数：用 URLSearchParams 拼接而不是字符串相加 ---');
{
  const params = new URLSearchParams({ limit: '2' });
  params.append('sort', 'age'); // 还可以追加参数
  const response = await fetch(`${BASE}/api/users?${params}`);
  const data = await response.json();
  console.log('  请求的完整 URL：' + response.url);
  console.log('  拿到的条数 =', data.items.length, '（limit=2 生效）');
  console.log('  URLSearchParams 会自动处理特殊字符的转义，手写拼接很容易出错。');
}
console.log('');

// ===========================================================================
// 第 4 部分：POST 提交 JSON
// ===========================================================================

console.log('--- 4. POST：body 必须是字符串，并且要设 Content-Type ---');
{
  const payload = { name: '新同学', age: 20 };
  const response = await fetch(`${BASE}/api/users`, {
    method: 'POST', // 默认是 GET，提交数据必须显式指定
    headers: {
      // 告诉服务器"我发的是 JSON"，否则服务器可能解析不出来
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload), // 对象不能直接当 body，必须序列化成字符串
  });
  console.log('  状态码 =', response.status, '（创建成功是 201 而不是 200）');
  console.log('  Location 响应头 =', response.headers.get('location'), '（指向新建的资源）');
  const created = await response.json();
  console.log('  服务器返回的新对象：', created);
}
console.log('');

// ===========================================================================
// 第 5 部分：HTTP 错误不会让 fetch 拒绝
// ===========================================================================

console.log('--- 5. 最重要的陷阱：404 / 500 也会让 Promise 成功 ---');
{
  // 5.1 请求一个不存在的用户
  const res404 = await fetch(`${BASE}/api/users/999`);
  console.log('  请求 /api/users/999：');
  console.log('    Promise 成功了吗？是的（没有抛错）。response.ok =', res404.ok);
  console.log('    所以必须自己判断：if (!res.ok) 走错误分支');
  const err404 = await res404.json();
  console.log('    服务端返回的错误体：', err404);

  // 5.2 500 也是一样的道理
  const res500 = await fetch(`${BASE}/api/error`);
  console.log('  请求 /api/error：response.ok =', res500.ok, '，status =', res500.status);
  console.log('    错误响应体照样能正常解析：', await res500.json());

  // 5.3 正确的处理姿势：封装成"HTTP 错误就抛错"的函数
  console.log('  正确的处理姿势（封装成会抛错的函数）：');
  try {
    await requestJson(`${BASE}/api/error`);
  } catch (err) {
    console.log('    捕获到错误：' + err.name + ': ' + err.message);
    console.log('    还带上了状态码：' + err.status + '，错误体：' + JSON.stringify(err.body));
  }
}

/**
 * 把 fetch 包一层，让 HTTP 错误码也变成 reject——这是实际项目里最常见的封装。
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any>} 解析后的 JSON
 */
async function requestJson(url, options) {
  const response = await fetch(url, options);
  // 先看 Content-Type 再决定怎么解析，这样接口返回 HTML 报错页时不会炸
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    // 造一个带有状态码信息的错误对象，方便上层区分处理
    const error = new Error(`HTTP ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}
console.log('');

// ===========================================================================
// 第 6 部分：真正的"网络层错误"
// ===========================================================================

console.log('--- 6. 网络层错误：连不上服务器时 fetch 才会 reject ---');
{
  // 先起一个服务器再立刻关掉，这样这个端口一定是"没人监听"的
  const tmp = http.createServer();
  const deadPort = await new Promise((resolve) => {
    tmp.listen(0, '127.0.0.1', () => resolve(tmp.address().port));
  });
  await new Promise((resolve) => tmp.close(resolve)); // 关掉 → 端口上没人监听了

  try {
    await fetch(`http://127.0.0.1:${deadPort}/api/users`);
    console.log('  不应该走到这里');
  } catch (err) {
    console.log('  连不上 127.0.0.1:' + deadPort + ' → 抛错');
    console.log('    错误类型：' + err.name); // TypeError: fetch failed
    console.log('    错误信息：' + err.message);
    // Node 的 fetch 会把底层错误放在 cause 里，浏览器里通常没有 cause
    if (err.cause) console.log('    底层原因：' + err.cause.code + ' ' + err.cause.message);
    console.log('  这也是唯一一种 fetch 会 reject 的情况：请求根本没发出去/没回来。');
  }
}
console.log('');

// ===========================================================================
// 第 7 部分：用 AbortController 实现超时取消
// ===========================================================================

console.log('--- 7. AbortController：取消请求 + 实现超时 ---');

/** 带超时的 fetch 封装（浏览器与 Node 通用） */
async function fetchWithTimeout(url, options = {}, timeoutMs = 200) {
  const controller = new AbortController();
  // 到点就调用 abort()：fetch 会以名为 AbortError 的错误拒绝
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal }); // 把信号交给 fetch
  } catch (err) {
    // 区分"我主动取消"和"真的出错了"，这样调用方才能正确提示用户
    if (err.name === 'AbortError') throw new Error('请求超时（超过 ' + timeoutMs + 'ms 未响应）');
    throw err;
  } finally {
    clearTimeout(timer); // 无论成功失败都要清掉定时器，否则会拖住事件循环
  }
}

{
  // 7.1 超时场景：服务器要 400ms 才响应，我们只等 150ms
  try {
    await fetchWithTimeout(`${BASE}/api/slow`, {}, 150);
    console.log('  不应该走到这里');
  } catch (err) {
    console.log('  超时场景：' + err.name + ' → ' + err.message);
    console.log('    （注意：超时不是 fetch 自带的参数，必须用 AbortController 手工实现）');
  }

  // 7.2 正常场景：给足时间就能拿到结果
  const res = await fetchWithTimeout(`${BASE}/api/slow`, {}, 2000);
  console.log('  放宽到 2000ms：状态码 =', res.status, '，结果 =', (await res.json()).message);

  // 7.3 手动取消：模拟"用户切走了页面，请求没意义了"
  const controller = new AbortController();
  const pending = fetch(`${BASE}/api/slow`, { signal: controller.signal });
  controller.abort(); // 立刻取消
  try {
    await pending;
  } catch (err) {
    console.log('  手动 abort()：' + err.name);
  }
}
console.log('');

// ===========================================================================
// 第 8 部分：Response 的 body 只能读一次
// ===========================================================================

console.log('--- 8. 陷阱：Response 的 body 是一次性的 ---');
{
  const response = await fetch(`${BASE}/api/users/1`);
  const first = await response.json(); // 第一次读，成功
  console.log('  第一次 json() 读到：', first);
  try {
    await response.text(); // 第二次读同一个 body
  } catch (err) {
    console.log('  第二次再读同一个响应：抛错 → ' + err.message);
    console.log('  解决：先用 response.clone() 复制一份，或者在合适的时机只读一次并传下去。');
  }

  // clone() 的正确用法
  const res2 = await fetch(`${BASE}/api/users/1`);
  const copy1 = res2.clone();
  const copy2 = res2.clone();
  console.log('  用 clone() 复制两份后：json =', (await copy1.json()).name, '，text 前 20 字符 =', (await copy2.text()).slice(0, 20) + '...');
}
console.log('');

// ===========================================================================
// 第 9 部分：并发请求与手写 Response
// ===========================================================================

console.log('--- 9. 并发请求：Promise.all 一起发 ---');
{
  const started = Date.now();
  // 三个请求并发发出，总耗时约等于最慢的那个，而不是三个之和
  const [a, b, c] = await Promise.all([
    fetch(`${BASE}/api/users`).then((r) => r.json()),
    fetch(`${BASE}/api/users/1`).then((r) => r.json()),
    fetch(`${BASE}/api/users/2`).then((r) => r.json()),
  ]);
  console.log('  三个请求并发完成，耗时 ' + (Date.now() - started) + 'ms');
  console.log('  结果：列表 ' + a.total + ' 条、用户1 = ' + b.name + '、用户2 = ' + c.name);
}
console.log('');

console.log('--- 10. 不走网络也能造 Response（浏览器里常用来做本地 mock） ---');
{
  // Response 构造函数在浏览器和 Node 里都可用
  const fake = new Response(JSON.stringify({ mock: true, items: [1, 2, 3] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  console.log('  手写 Response：status =', fake.status, '，ok =', fake.ok);
  console.log('  解析：', await fake.json());
  console.log('  在浏览器里，用它可以给 fetch 打桩（stub），让前端不依赖后端也能开发。');
}
console.log('');

// ===========================================================================
// 第 10 部分：关掉服务器，让进程自然退出
// ===========================================================================

console.log('--- 11. 收尾：关闭服务器 ---');
// fetch（undici）默认会复用连接（keep-alive），所以要先强制断开所有连接，
// 否则 server.close() 会一直等这些空闲连接，进程迟迟不退出。
server.closeAllConnections();
await new Promise((resolve) => server.close(resolve));
console.log('服务器已关闭，程序即将退出。');
