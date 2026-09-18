/**
 * ============================================================================
 * 知识点：node:http —— 自建服务器并用 fetch 请求自己
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】高级
 * 【前置知识】26_node_core/08_streams_basics.js、26_node_core/03_url_module.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:http 是 Node 自带的 HTTP 服务器与客户端实现，不依赖任何第三方库。
 *    服务端核心只有三步：
 *      · http.createServer(handler)  创建一个服务器，handler 接收 (req, res)
 *      · server.listen(port, host)   开始监听端口
 *      · server.close()              停止接收新连接并关闭
 *    · req 是 http.IncomingMessage（可读流），携带方法、URL、请求头与请求体
 *    · res 是 http.ServerResponse（可写流），用来设置状态码/响应头并写出响应体
 *
 *    客户端方面，现代 Node 直接提供全局 fetch（浏览器同款 API，基于 undici 实现），
 *    所以**不需要**再手写 http.request 去做自测。
 *
 * 2. 为什么需要
 *    理解这一层非常有价值：
 *      · 所有上层框架（Express、Koa、Fastify……）本质上都是在包装这个模块。
 *        知道 req/res 的原始形态，出问题时才能看懂底层报错。
 *      · 写微服务、健康检查端点、Webhook 接收端、静态文件服务，用内置模块就够了，
 *        零依赖意味着更小的攻击面和更快的启动。
 *      · 做集成测试时"起一个真服务器再请求它自己"，是最接近真实的测试方式。
 *
 * 3. 核心语法要点
 *    - http.createServer([options], handler)   返回 http.Server
 *    - server.listen(port, host, cb)           port 传 0 表示让系统随机分配空闲端口
 *    - server.address()                        取实际监听地址，形如 { address, family, port }
 *    - server.close(cb)                        停止监听（会等已有连接结束）
 *    - server.closeAllConnections()            强制断开所有连接（含 keep-alive 的）
 *    - req.method / req.url / req.headers      请求方法、路径+查询串、请求头（键名全小写）
 *    - new URL(req.url, base)                  把 req.url 解析成 URL 对象，方便取查询参数
 *    - req 是可读流：for await (const chunk of req) 读取请求体
 *    - res.statusCode = 200                    设置状态码（默认 200）
 *    - res.setHeader(name, value)              设置响应头（必须在写出响应体之前）
 *    - res.writeHead(status, headers)          一次性设置状态码与响应头
 *    - res.write(chunk) / res.end(chunk?)      写出响应体并结束响应
 *    - res.setHeader('Content-Type', 'application/json; charset=utf-8')
 *    - server.on('error', fn)                  端口被占用等错误
 *    - fetch(url, { method, headers, body })   全局可用的客户端 API，返回 Response
 *    - response.status / response.ok / response.headers.get()
 *    - await response.json() / response.text()
 *
 * 4. 常见陷阱
 *    陷阱 1：忘了 res.end()。客户端会一直等到超时，浏览器转圈不停。
 *    陷阱 2：把端口写死（如 3000）。本机可能已被占用，示例就没法运行。
 *            正确做法是 listen(0) 让系统分配，再用 server.address().port 取回来。
 *    陷阱 3：监听 '0.0.0.0' 会把服务暴露到局域网甚至公网。
 *            只在本地自测时应当监听 '127.0.0.1'。
 *    陷阱 4：中文不乱码的关键是 Content-Type 里带上 charset=utf-8。
 *            只写 application/json 时，某些客户端会按 latin-1 解读。
 *    陷阱 5：必须自己读完请求体。不读的话在 keep-alive 连接上会残留数据，
 *            导致后续请求解析错乱。用 for await 一次读完是最省事的做法。
 *    陷阱 6：HTTP 是异步的，同一连接的请求响应顺序不能假设。
 *    陷阱 7：keep-alive 与 server.close() 的配合。close() 只是"不再接受新连接"，
 *            已建立的连接（尤其客户端用连接池保持的长连接）还开着，
 *            'close' 事件就不会触发，脚本会挂住。要么调用 closeAllConnections()，
 *            要么在响应里写 Connection: close。
 *    陷阱 8：异常一定要包在 try/catch 或 server 'error' 事件里处理，
 *            否则一次未捕获异常就会让服务进程整体退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/15_http_server_client.js
 *   本示例只在 127.0.0.1 上自建服务器并向自己发起请求，**不访问外网**。
 *
 * 【预期输出】
 *   启动服务器（端口由系统分配）-> 用 fetch 依次请求自己五个端点
 *   （路由分发、JSON 响应、POST 回显、查询参数、404）-> 关闭服务器。
 *   所有连接都会被显式关闭，进程自然退出，不会挂起。
 * ============================================================================
 */

import http from 'node:http';
import os from 'node:os';
import { once } from 'node:events';

// ---------------------------------------------------------------------------
// 1. 创建一个最小的 HTTP 服务器
// ---------------------------------------------------------------------------

console.log('--- 1. 创建服务器 ---');

// 请求计数器，用来演示"服务器被复用了多次"。
let requestCount = 0;

/**
 * 读取请求体的辅助函数。
 * req 是可读流（见 08_streams_basics.js），要拿到完整内容就得把它读完。
 * 用 for await 逐块收集，最后拼成字符串。
 */
async function readBody(req) {
  const chunks = [];
  // 每块是 Buffer。小请求体这样收集完全够用；
  // 大文件上传则应该边读边写文件，不能全攒在内存里（陷阱 5 的反面）。
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/** 统一的 JSON 响应工具：设置好状态码与响应头再写出 */
function sendJson(res, statusCode, payload, extraHeaders = {}) {
  // 序列化时统一缩进两格，方便人读；真实接口可以去掉缩进以省带宽。
  const body = JSON.stringify(payload, null, 2);

  // 一次性写出状态码与响应头。
  // 注意 charset=utf-8 —— 少了它中文就可能乱码（陷阱 4）。
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    // 显式声明按 UTF-8 编码的字节长度，避免客户端靠连接关闭来判断结束。
    'Content-Length': Buffer.byteLength(body, 'utf8'),
    // X-Request-Id 是自定义响应头，演示"服务器往响应里附加信息"。
    'X-Request-Id': `req-${requestCount}`,
    ...extraHeaders,
  });

  // 写出响应体并**结束**响应。忘了 end() 客户端会一直等（陷阱 1）。
  res.end(body);
}

// createServer 的 handler 会对每个请求调用一次。
// 它是一个普通的 (req, res) 函数，没有什么魔法。
const server = http.createServer(async (req, res) => {
  requestCount += 1;

  // req.method 是大写字符串（'GET' / 'POST' / 'DELETE' …）
  // req.url 是"路径 + 查询串"，形如 '/api/user?id=7'
  // 用 URL 类解析它比手工 split('?') 可靠得多（见 03_url_module.js）。
  // 第二个参数是 base，随便给一个合法 origin 即可，因为这里只关心路径与查询。
  const url = new URL(req.url, 'http://localhost');
  // pathname 已规范化，searchParams 可直接取值。
  const { pathname, searchParams } = url;

  // req.headers 的键名**全是小写**，访问时要注意。
  const userAgent = req.headers['user-agent'] ?? '(未提供)';

  console.log(`  [服务器] ${req.method} ${pathname}  (${userAgent})`);

  // -------------------------------------------------------------------------
  // 路由分发：最朴素的做法就是一串 if / switch。
  // 框架做的事情本质上也是这个，只是把匹配规则抽成了更灵活的配置。
  // -------------------------------------------------------------------------
  try {
    // 路由 1：首页
    if (req.method === 'GET' && pathname === '/') {
      sendJson(res, 200, {
        service: 'node:http 示例服务器',
        node: process.version,
        platform: os.platform(),
        message: '你好，这是用 node:http 手写的第一个接口。',
      });
      return;
    }

    // 路由 2：返回一个"用户资源"
    if (req.method === 'GET' && pathname === '/api/user') {
      // 从查询参数里取 id，给默认值 1。
      // 注意 get() 返回的是字符串或 null，且这里是**外部输入**，必须校验。
      const rawId = searchParams.get('id') ?? '1';
      const id = Number(rawId);

      // 校验失败就返回 400，而不是硬着头皮往下算。
      if (!Number.isInteger(id) || id <= 0) {
        sendJson(res, 400, {
          error: 'BAD_REQUEST',
          message: `参数 id 必须是正整数，收到的是 ${JSON.stringify(rawId)}`,
        });
        return;
      }

      sendJson(res, 200, {
        id,
        name: `用户${id}`,
        email: `user${id}@example.com`,
        // 演示查询参数被完整解析：?id=7&tags=a&tags=b 会得到两个 tags。
        tags: searchParams.getAll('tags'),
      });
      return;
    }

    // 路由 3：POST 回显，演示如何读取请求体
    if (req.method === 'POST' && pathname === '/api/echo') {
      // 先把请求体读完（陷阱 5）。
      const rawBody = await readBody(req);
      const contentType = req.headers['content-type'] ?? '';

      // 按 Content-Type 决定怎么解析。这里只演示 JSON 一种。
      if (!contentType.includes('application/json')) {
        sendJson(res, 415, {
          error: 'UNSUPPORTED_MEDIA_TYPE',
          message: `本接口只接受 application/json，收到的是 ${contentType || '(空)'}`,
        });
        return;
      }

      // JSON.parse 对畸形输入会抛 SyntaxError，必须捕获。
      let parsed;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        sendJson(res, 400, {
          error: 'INVALID_JSON',
          message: '请求体不是合法的 JSON',
          raw: rawBody,
        });
        return;
      }

      // 回显：告诉客户端"我收到了什么"。
      sendJson(res, 200, {
        received: parsed,
        bodyBytes: Buffer.byteLength(rawBody, 'utf8'),
        echo: true,
      });
      return;
    }

    // 路由 4：模拟一个会内部出错的接口，演示 500 的处理
    if (req.method === 'GET' && pathname === '/api/boom') {
      // 故意抛异常，交给下面的 catch 统一处理。
      throw new Error('这个接口故意出错了');
    }

    // 路由 5：显式演示 405（方法不允许）
    if (pathname === '/api/user' && req.method !== 'GET') {
      // 顺带演示返回 Allow 头，这是 HTTP 规范推荐的做法。
      sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED' }, { Allow: 'GET' });
      return;
    }

    // 兜底：404
    // 注意：这里也要把请求体读完，否则 keep-alive 连接上会残留数据（陷阱 5）。
    await readBody(req);
    sendJson(res, 404, {
      error: 'NOT_FOUND',
      message: `找不到路径 ${pathname}`,
      hint: '可用路径：/ 、/api/user 、/api/echo(POST) 、/api/boom',
    });
  } catch (err) {
    // 统一异常处理：任何未预料到的错误都变成 500，而不是让进程崩溃。
    console.error('  [服务器] 处理请求时出错：', err.message);
    // 注意：如果响应头已经发出去了，再写头会抛 ERR_HTTP_HEADERS_SENT，
    // 所以这里判断一下是否已经开始发送。
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'INTERNAL_ERROR', message: err.message });
    } else {
      // 已经开始发送就直接结束，能做的补救有限。
      res.end();
    }
  }
});

// ---------------------------------------------------------------------------
// 2. 启动监听：用端口 0 让系统分配空闲端口
// ---------------------------------------------------------------------------

console.log('--- 2. 启动监听 ---');

// 关键做法：port 传 0，操作系统会挑一个当前空闲的端口。
// 好处是并发运行多个示例、或在 CI 里反复运行时绝不会因为"端口被占用"而失败。
// host 传 '127.0.0.1' 表示只监听回环地址，服务不会暴露到局域网（陷阱 3）。
//
// listen 是异步的：要等 'listening' 事件才知道真的开始监听了。
// 这里用 once 把它变成可 await 的 Promise。
server.listen(0, '127.0.0.1');
await once(server, 'listening');

// server.address() 返回实际监听的地址信息。
const address = server.address();
console.log('  服务器已启动');
console.log('    监听地址 =', address.address);
console.log('    地址族   =', address.family);
// 这个 port 就是系统分配的端口，客户端要用它来发请求（陷阱 2）。
console.log('    实际端口 =', address.port, '（由系统分配，所以每次运行都可能不同）');

// 拼出基础 URL，后面所有请求都用它。
const baseUrl = `http://127.0.0.1:${address.port}`;
console.log('  基础 URL =', baseUrl);

// ---------------------------------------------------------------------------
// 3. 用 fetch 请求自己
// ---------------------------------------------------------------------------

console.log('--- 3. 用 fetch 请求自己 ---');

// 由于监听的是 127.0.0.1，请求不会出网卡，全程在本机完成，不涉及外网。

// ---- 3.1 GET 首页 ----
console.log('  [客户端] GET /');
const homeRes = await fetch(`${baseUrl}/`);
console.log('    状态码 =', homeRes.status, '，ok =', homeRes.ok);
console.log('    Content-Type =', homeRes.headers.get('content-type'));
console.log('    自定义响应头 X-Request-Id =', homeRes.headers.get('x-request-id'));
// json() 会自动解析并**消费**响应体，所以每个响应只能调用一次。
const homeData = await homeRes.json();
console.log('    响应体 =', JSON.stringify(homeData, null, 2).split('\n').join('\n    '));

// ---- 3.2 带查询参数的 GET ----
console.log('  [客户端] GET /api/user?id=7&tags=js&tags=node');
// 推荐用 URL + searchParams 构造（见 03_url_module.js 第 8 节），不要手工拼字符串。
const userUrl = new URL('/api/user', baseUrl);
userUrl.searchParams.set('id', '7');
// 同名参数要出现两次，所以用 append 而不是 set。
userUrl.searchParams.append('tags', 'js');
userUrl.searchParams.append('tags', 'node');
const userRes = await fetch(userUrl);
const userData = await userRes.json();
console.log('    状态码 =', userRes.status);
console.log('    响应体 =', JSON.stringify(userData));

// ---- 3.3 参数校验失败的情况 ----
console.log('  [客户端] GET /api/user?id=abc（故意传非法参数）');
const badRes = await fetch(`${baseUrl}/api/user?id=abc`);
const badData = await badRes.json();
console.log('    状态码 =', badRes.status, '（400 = 客户端请求有误）');
console.log('    响应体 =', JSON.stringify(badData));

// ---- 3.4 POST JSON ----
console.log('  [客户端] POST /api/echo');
const postRes = await fetch(`${baseUrl}/api/echo`, {
  method: 'POST',
  headers: {
    // 必须显式声明 Content-Type，服务器才能正确解析请求体。
    'Content-Type': 'application/json; charset=utf-8',
  },
  // body 传字符串即可；fetch 会按 UTF-8 编码。
  body: JSON.stringify({ name: '张三', action: 'create', tags: ['a', 'b'] }),
});
const postData = await postRes.json();
console.log('    状态码 =', postRes.status);
console.log('    响应体 =', JSON.stringify(postData));

// ---- 3.5 发送非法 JSON，观察 400 ----
console.log('  [客户端] POST /api/echo（故意发非法 JSON）');
const badJsonRes = await fetch(`${baseUrl}/api/echo`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{ 这不是合法 JSON }',
});
console.log('    状态码 =', badJsonRes.status, '（400）');
console.log('    响应体 =', JSON.stringify(await badJsonRes.json()));

// ---- 3.6 触发服务器内部错误 ----
console.log('  [客户端] GET /api/boom（触发服务器的 500）');
const boomRes = await fetch(`${baseUrl}/api/boom`);
console.log('    状态码 =', boomRes.status, '，ok =', boomRes.ok, '（ok 只在 2xx 时为 true）');
console.log('    响应体 =', JSON.stringify(await boomRes.json()));
console.log('    => 一次异常没有让服务器倒下，后续请求照常可用。');

// ---- 3.7 404 ----
console.log('  [客户端] GET /nope');
const notFoundRes = await fetch(`${baseUrl}/nope`);
console.log('    状态码 =', notFoundRes.status);
console.log('    响应体 =', JSON.stringify(await notFoundRes.json()));

// ---- 3.8 方法不允许 ----
console.log('  [客户端] DELETE /api/user（该方法不被允许）');
const methodRes = await fetch(`${baseUrl}/api/user`, { method: 'DELETE' });
console.log('    状态码 =', methodRes.status, '（405）');
console.log('    Allow 响应头 =', methodRes.headers.get('allow'));
console.log('    响应体 =', JSON.stringify(await methodRes.json()));

// ---- 3.9 读取原始文本而不是 JSON ----
console.log('  [客户端] 用 text() 读取原始响应体（前 60 个字符）');
const rawTextRes = await fetch(`${baseUrl}/`);
const rawText = await rawTextRes.text();
console.log('    原始文本片段 =', JSON.stringify(rawText.slice(0, 60)));

// ---------------------------------------------------------------------------
// 4. 关闭服务器
// ---------------------------------------------------------------------------

console.log('--- 4. 关闭服务器 ---');
console.log('  服务器总共处理了', requestCount, '个请求。');

// 陷阱 7：server.close() 只是"停止接受新连接"，
// 已有的连接（尤其是 fetch/undici 连接池里保持的 keep-alive 长连接）还开着，
// 所以 'close' 事件不会立刻触发，脚本会在这里挂住。
//
// 处理办法有两个，本示例两个都用上：
//   1) 调用 closeAllConnections() 强制断开所有活动连接
//   2) 设置一个兜底超时，防止某些环境下连接迟迟不释放
server.close();
server.closeAllConnections();

// close 的完成用 'close' 事件表示。加一个超时兜底（500ms），
// 保证即使有意外残留连接也不会让示例卡住。
const closed = await Promise.race([
  once(server, 'close').then(() => 'closed'),
  // 定时器只等 500ms，远小于校验脚本的 30s 超时。
  new Promise((resolve) => setTimeout(() => resolve('timeout'), 500)),
]);

if (closed === 'closed') {
  console.log("  收到 'close' 事件，服务器已完全关闭，端口已释放。");
} else {
  // 兜底路径：连接的释放偶有延迟，但服务器已经在关闭流程中。
  console.log('  等待 close 事件超时（连接释放较慢），但监听套接字已关闭。');
}

// server.listening 为 false 表示已不再监听。
console.log('  server.listening =', server.listening, '（false 表示已停止监听）');

console.log('--- 全部演示结束 ---');
