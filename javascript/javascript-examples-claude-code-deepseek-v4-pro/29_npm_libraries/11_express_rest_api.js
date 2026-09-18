/**
 * ============================================================================
 * 知识点：express 实战 —— 一个完整的迷你 REST API（CRUD + 内存存储 + 状态码）
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】高级
 * 【前置知识】29_npm_libraries/10_express_server.js、05_zod_validation.js（可选）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    REST 是一种"用 HTTP 的语义来表达对资源的增删改查"的接口风格。
 *    它的核心约定：
 *      资源用名词复数表示路径：/api/products（不是 /getProducts）
 *      动词由 HTTP 方法表达：
 *        GET     /products        列出资源（幂等、安全，可缓存）
 *        GET     /products/:id    读取单个资源
 *        POST    /products        创建资源（不幂等，重复调用会创建多个）
 *        PUT     /products/:id    整体替换（幂等，重复调用结果相同）
 *        PATCH   /products/:id    局部更新（只改传入的字段）
 *        DELETE  /products/:id    删除资源（幂等）
 *      状态码表达结果：
 *        200 OK / 201 Created / 204 No Content
 *        400 Bad Request / 401 Unauthorized / 403 Forbidden
 *        404 Not Found / 405 Method Not Allowed / 409 Conflict
 *        422 Unprocessable Entity（语法对但语义不合法）
 *        500 Internal Server Error
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    只要前后端分离，就一定会有一个 HTTP 接口层。REST 的价值在于"约定优于配置"：
 *    任何人看到 GET /api/products/42 就知道它做什么、返回什么、失败时是什么状态码。
 *    本文件实现的是一个"麻雀虽小五脏俱全"的 API：
 *      - 分层：路由层（router）-> 服务层（store）-> 数据层（内存 Map）；
 *      - 统一的成功/失败响应格式；
 *      - 分页、过滤、排序、字段校验；
 *      - 冲突检测（SKU 唯一）；
 *      - 每个请求带 requestId，便于串联日志。
 *
 * 3. 核心语法要点
 *    const router = express.Router();              路由分组，可挂在前缀上
 *    app.use('/api/products', router)              挂载路由
 *    router.route('/:id').get(f).put(f).delete(f)  对同一路径链式注册多个方法
 *    app.use((req,res,next) => { res.locals.x = y; next(); })   请求级共享数据
 *    res.status(204).end()                          无响应体时必须 end 而不是 json
 *    res.set('Location', url)                       201 时指向新资源
 *    状态码选择：
 *      校验失败 -> 422（字段格式问题）或 400（请求本身有问题）
 *      唯一键冲突 -> 409
 *      资源不存在 -> 404
 *
 * 4. 常见陷阱
 *    - DELETE 成功返回 204 时不要带响应体（有些客户端会因此报错）。
 *    - PUT 的语义是"整体替换"：没传的字段应当被清空/置默认值，而不是保留原值。
 *      想"只改传进来的字段"要用 PATCH。混用是接口设计里最常见的错误之一。
 *    - 分页参数必须设上限：`?pageSize=1000000` 会把内存打爆。
 *    - 列表接口要返回 total，否则前端无法渲染分页器。
 *    - 排序字段要白名单校验，否则会被注入（MongoDB/ORM 场景尤其危险）。
 *    - 删除不存在的资源：返回 404 还是 204？两种都有道理，
 *      但必须在团队内统一（本文件选 404，因为能帮客户端尽早发现 bug）。
 *    - 路径设计不要用动词：/products/create 不如 POST /products。
 *    - 版本号放在路径里（/api/v1/...）是最简单可靠的 API 版本化方案。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/11_express_rest_api.js
 *   （listen(0) 分配随机端口，用 fetch 跑完整流程，最后 server.close()，退出码 0）
 *
 * 【预期输出】
 *   按顺序打印一次完整的 CRUD 流程（创建 -> 查询 -> 更新 -> 删除），
 *   并逐条打印状态码与响应体，最后关闭服务器。退出码 0。
 * ============================================================================
 */

import express from 'express';
import assert from 'node:assert/strict';

// ===========================================================================
// 第 1 部分：数据层（内存存储，模拟数据库）
// ===========================================================================

/**
 * 商品仓储。用 Map 存储，并提供一套"看起来像数据库"的方法。
 * 真实项目里这一层会被替换成 Prisma / TypeORM / 原生 SQL，而上层代码不用改。
 */
class ProductStore {
  constructor() {
    /** @type {Map<number, {id:number, sku:string, name:string, price:number, stock:number, tags:string[], createdAt:string, updatedAt:string}>} */
    this.items = new Map();
    this.nextId = 1;
  }

  /** 生成当前时间的 ISO 字符串（集中一处便于测试时替换） */
  now() {
    return new Date().toISOString();
  }

  /** 列出全部商品（未分页），供上层做过滤与排序 */
  all() {
    return [...this.items.values()];
  }

  findById(id) {
    return this.items.get(Number(id));
  }

  findBySku(sku) {
    // 模拟数据库的唯一索引查询
    for (const item of this.items.values()) {
      if (item.sku === sku) return item;
    }
    return undefined;
  }

  create(data) {
    const timestamp = this.now();
    const product = {
      id: this.nextId,
      sku: data.sku,
      name: data.name,
      price: data.price,
      stock: data.stock ?? 0,
      tags: data.tags ?? [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.nextId += 1;
    this.items.set(product.id, product);
    return product;
  }

  /** 整体替换（PUT 语义）：未提供的可选字段回到默认值 */
  replace(id, data) {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const replaced = {
      id: existing.id,
      sku: data.sku,
      name: data.name,
      price: data.price,
      stock: data.stock ?? 0, // PUT 未传 stock -> 回到默认值 0（而不是保留原值）
      tags: data.tags ?? [],
      createdAt: existing.createdAt, // 创建时间不可变
      updatedAt: this.now(),
    };
    this.items.set(existing.id, replaced);
    return replaced;
  }

  /** 局部更新（PATCH 语义）：只覆盖传入的字段 */
  patch(id, changes) {
    const existing = this.findById(id);
    if (!existing) return undefined;
    const patched = { ...existing, ...changes, id: existing.id, updatedAt: this.now() };
    this.items.set(existing.id, patched);
    return patched;
  }

  remove(id) {
    return this.items.delete(Number(id));
  }

  get size() {
    return this.items.size;
  }

  /** 清空并重新播种，仅供演示/测试使用 */
  reset(seed = []) {
    this.items.clear();
    this.nextId = 1;
    for (const item of seed) this.create(item);
  }
}

const store = new ProductStore();

// ===========================================================================
// 第 2 部分：领域错误与校验
// ===========================================================================

/** 带 HTTP 语义的错误。expose=true 表示 message 可以安全返回给客户端。 */
class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.expose = true;
    // details 用于携带"哪个字段错了"这类结构化信息（如 422 的场景）
    if (details !== undefined) this.details = details;
  }
}

/**
 * 校验商品请求体。
 * @param {unknown} body
 * @param {{partial?: boolean}} [options] partial=true 时用于 PATCH（允许只传部分字段）
 * @returns {{sku?: string, name?: string, price?: number, stock?: number, tags?: string[]}}
 */
function validateProductBody(body, options = {}) {
  const { partial = false } = options;
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_BODY', '请求体必须是一个 JSON 对象');
  }

  const errors = [];
  const result = {};

  /** 按需校验单个字段，把错误累积起来一次性返回（比"报一个改一个"体验好） */
  const checkField = (field, validate, { required }) => {
    const value = body[field];
    if (value === undefined) {
      if (required && !partial) {
        errors.push({ field, message: `${field} 是必填字段` });
      }
      return;
    }
    const error = validate(value);
    if (error) {
      errors.push({ field, message: error });
    } else {
      result[field] = value;
    }
  };

  checkField('sku', (v) => {
    if (typeof v !== 'string') return 'sku 必须是字符串';
    if (!/^[A-Z]{2,4}-\d{3,6}$/.test(v)) return 'sku 格式应为 2~4 个大写字母 + 短横线 + 3~6 位数字（如 AB-123）';
    return null;
  }, { required: true });

  checkField('name', (v) => {
    if (typeof v !== 'string') return 'name 必须是字符串';
    if (v.trim().length < 2 || v.trim().length > 60) return 'name 长度必须在 2~60 个字符之间';
    return null;
  }, { required: true });

  checkField('price', (v) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return 'price 必须是有限数字';
    if (v < 0) return 'price 不能为负数';
    if (v > 1_000_000) return 'price 超过上限 1000000';
    // 用"分"做整数运算避免浮点误差，是金额处理的通用做法
    if (Math.round(v * 100) !== v * 100) return 'price 最多保留两位小数';
    return null;
  }, { required: true });

  checkField('stock', (v) => {
    if (!Number.isInteger(v)) return 'stock 必须是整数';
    if (v < 0) return 'stock 不能为负数';
    return null;
  }, { required: false });

  checkField('tags', (v) => {
    if (!Array.isArray(v)) return 'tags 必须是数组';
    if (v.length > 10) return 'tags 最多 10 个';
    if (!v.every((t) => typeof t === 'string' && t.length <= 20)) return 'tags 的每一项必须是不超过 20 字符的字符串';
    return null;
  }, { required: false });

  if (errors.length > 0) {
    // 422：请求语法没问题，但语义不合法（字段值不符合业务规则）
    throw new HttpError(422, 'VALIDATION_ERROR', '请求参数校验失败', errors);
  }
  return result;
}

// ===========================================================================
// 第 3 部分：路由层
// ===========================================================================

const app = express();
app.use(express.json({ limit: '256kb' }));

// 请求级中间件：为每个请求分配 ID，并统一响应格式的辅助方法
app.use((req, res, next) => {
  req.requestId = `req-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
  res.set('X-Request-Id', req.requestId);

  /** 统一的成功响应格式：真实项目里应当全站保持一致 */
  res.ok = (data, status = 200) => res.status(status).json({ success: true, data, requestId: req.requestId });
  /** 统一的错误响应格式 */
  res.fail = (status, code, message, details) =>
    res.status(status).json({
      success: false,
      error: { code, message, ...(details === undefined ? {} : { details }) },
      requestId: req.requestId,
    });
  next();
});

/** 路由分组：把所有商品相关接口挂在 /api/v1/products 下 */
const router = express.Router();

// ---------------------------------------------------------------------------
// 中间件：把 :id 解析成资源并挂到 req.product 上，避免每个路由都重复查找
// ---------------------------------------------------------------------------
router.param('id', (req, res, next, rawId) => {
  // router.param 是 express 的路由级中间件，对这个 router 里所有含 :id 的路由生效
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    return next(new HttpError(400, 'INVALID_ID', `id 必须是正整数，收到 "${rawId}"`));
  }
  const product = store.findById(id);
  if (!product) {
    return next(new HttpError(404, 'PRODUCT_NOT_FOUND', `商品 ${id} 不存在`));
  }
  req.product = product; // 后续处理函数直接用它，不用再查一次
  // eslint-disable-next-line no-unused-vars
  next();
});

// ---------------------------------------------------------------------------
// GET /api/v1/products —— 列表：分页 + 过滤 + 排序
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  const { page = '1', pageSize = '10', keyword, tag, sort = 'id', order = 'asc' } = req.query;

  const pageNum = Number(page);
  const sizeNum = Number(pageSize);

  // 分页参数必须校验，否则 pageSize=100000 会把内存打爆
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    throw new HttpError(400, 'INVALID_PAGINATION', 'page 必须是 >= 1 的整数');
  }
  if (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > 100) {
    throw new HttpError(400, 'INVALID_PAGINATION', 'pageSize 必须是 1~100 之间的整数');
  }

  let list = store.all();

  // 过滤：关键字匹配 name 或 sku
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(kw) || p.sku.toLowerCase().includes(kw));
  }
  // 过滤：包含指定标签
  if (tag) {
    list = list.filter((p) => p.tags.includes(String(tag)));
  }

  // 排序：字段必须白名单校验，否则可能被用来探测内部结构
  const sortableFields = new Set(['id', 'name', 'price', 'stock', 'createdAt']);
  if (!sortableFields.has(String(sort))) {
    throw new HttpError(400, 'INVALID_SORT', `sort 只支持：${[...sortableFields].join(', ')}`);
  }
  if (!['asc', 'desc'].includes(String(order))) {
    throw new HttpError(400, 'INVALID_SORT', 'order 只能是 asc 或 desc');
  }
  const direction = order === 'desc' ? -1 : 1;
  list.sort((a, b) => {
    const va = a[sort];
    const vb = b[sort];
    if (va === vb) return 0;
    return va > vb ? direction : -direction;
  });

  // 分页：先算 total 再切片 —— total 是前端渲染分页器的必要信息
  const total = list.length;
  const start = (pageNum - 1) * sizeNum;
  const pageItems = list.slice(start, start + sizeNum);

  res.ok({
    items: pageItems,
    pagination: {
      page: pageNum,
      pageSize: sizeNum,
      total,
      totalPages: Math.ceil(total / sizeNum),
      hasNext: start + sizeNum < total,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/products/:id —— 详情
// ---------------------------------------------------------------------------
router.get('/:id', (req, res) => {
  // req.product 已经由 router.param 中间件准备好了
  res.ok(req.product);
});

// ---------------------------------------------------------------------------
// POST /api/v1/products —— 创建
// ---------------------------------------------------------------------------
router.post('/', (req, res) => {
  const data = validateProductBody(req.body);

  // 唯一键冲突：返回 409 而不是 400 —— 状态码要表达"冲突"这个语义
  if (store.findBySku(data.sku)) {
    throw new HttpError(409, 'SKU_CONFLICT', `SKU ${data.sku} 已存在`);
  }

  const product = store.create(data);
  // 201 Created + Location 头指向新资源，是 REST 的规范做法
  res.set('Location', `/api/v1/products/${product.id}`);
  res.ok(product, 201);
});

// ---------------------------------------------------------------------------
// PUT /api/v1/products/:id —— 整体替换
// ---------------------------------------------------------------------------
router.put('/:id', (req, res) => {
  // PUT 要求提供完整资源，所以校验时必填字段缺一不可
  const data = validateProductBody(req.body);

  // SKU 改成了别人已经在用的值 -> 冲突
  const bySku = store.findBySku(data.sku);
  if (bySku && bySku.id !== req.product.id) {
    throw new HttpError(409, 'SKU_CONFLICT', `SKU ${data.sku} 已被商品 ${bySku.id} 使用`);
  }

  const updated = store.replace(req.product.id, data);
  res.ok(updated);
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/products/:id —— 局部更新
// ---------------------------------------------------------------------------
router.patch('/:id', (req, res) => {
  const changes = validateProductBody(req.body, { partial: true });

  if (Object.keys(changes).length === 0) {
    throw new HttpError(400, 'EMPTY_PATCH', 'PATCH 请求至少要包含一个可更新字段');
  }

  // 如果改了 sku，同样要检查唯一性
  if (changes.sku) {
    const bySku = store.findBySku(changes.sku);
    if (bySku && bySku.id !== req.product.id) {
      throw new HttpError(409, 'SKU_CONFLICT', `SKU ${changes.sku} 已被商品 ${bySku.id} 使用`);
    }
  }

  const patched = store.patch(req.product.id, changes);
  res.ok(patched);
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/products/:id —— 删除
// ---------------------------------------------------------------------------
router.delete('/:id', (req, res) => {
  store.remove(req.product.id);
  // 204 No Content：删除成功且没有内容要返回。
  // 注意必须用 end() 而不是 json()，204 响应不允许带响应体。
  res.status(204).end();
});

// ---------------------------------------------------------------------------
// 兜底：该 router 下的未知子路径
// ---------------------------------------------------------------------------
router.use((req, res, next) => {
  next(new HttpError(404, 'ROUTE_NOT_FOUND', `商品接口不支持 ${req.method} ${req.originalUrl}`));
});

// 挂载 router
app.use('/api/v1/products', router);

// 演示用的辅助接口：重置数据（真实项目里不会有这种接口）
app.post('/api/v1/_reset', (req, res) => {
  store.reset(req.body?.seed ?? []);
  res.ok({ message: '数据已重置', count: store.size });
});

// 全局 404 与错误处理中间件（必须放在所有路由之后）
app.use((req, res, next) => {
  next(new HttpError(404, 'ROUTE_NOT_FOUND', `找不到路由 ${req.method} ${req.originalUrl}`));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode ?? 500;
  // 只有主动构造（expose=true）的错误才把细节返回给客户端
  const code = err.expose === true ? err.code : 'INTERNAL_ERROR';
  const message = err.expose === true ? err.message : '服务器内部错误，请稍后重试';
  if (res.fail) {
    res.fail(statusCode, code, message, err.details);
  } else {
    // 极早期出错（还没走到注入 res.fail 的中间件）时的兜底
    res.status(statusCode).json({ success: false, error: { code, message } });
  }
});

// ===========================================================================
// 第 4 部分：启动服务并跑完整流程
// ===========================================================================

const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const { port } = server.address();
const BASE = `http://127.0.0.1:${port}/api/v1/products`;

console.log(`--- 0. REST API 已启动：http://127.0.0.1:${port} ---`);
console.log('  路由清单：');
console.log('    GET    /api/v1/products            列表（分页/过滤/排序）');
console.log('    GET    /api/v1/products/:id        详情');
console.log('    POST   /api/v1/products            创建 -> 201');
console.log('    PUT    /api/v1/products/:id        整体替换 -> 200');
console.log('    PATCH  /api/v1/products/:id        局部更新 -> 200');
console.log('    DELETE /api/v1/products/:id        删除 -> 204');
console.log('');

/**
 * 简化的请求工具。
 * @param {string} method
 * @param {string} url 相对 BASE 的路径（'' 表示集合本身）
 * @param {object} [options]
 */
async function call(method, url, options = {}) {
  const response = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  // 204 没有响应体，直接读 text 会得到空串
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: response.status, headers: response.headers, body };
}

/** 打印一次调用的结果 */
function show(label, result) {
  const payload = result.body === null ? '(无响应体)' : JSON.stringify(result.body);
  console.log(`  ${label}`);
  console.log(`    -> ${result.status} ${payload.length > 160 ? `${payload.slice(0, 157)}...` : payload}`);
}

// ---------------------------------------------------------------------------
console.log('--- 1. 准备数据：POST 创建三个商品 ---');
const createdResults = [];
for (const body of [
  { sku: 'KB-1001', name: '机械键盘', price: 299, stock: 50, tags: ['数码', '办公'] },
  { sku: 'MS-2002', name: '无线鼠标', price: 99.5, stock: 200, tags: ['数码'] },
  { sku: 'MN-3003', name: '27 寸显示器', price: 1299, stock: 10, tags: ['数码', '办公'] },
]) {
  const result = await call('POST', '', { body });
  createdResults.push(result);
  show(`POST ${JSON.stringify(body.sku)}`, result);
}
const [keyboard, mouse, monitor] = createdResults.map((r) => r.body.data);
console.log(`  注意 201 响应头里的 Location：${createdResults[0].headers.get('location')}`);
console.log('  也注意每个响应都带 requestId，方便把前后端日志串起来。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 2. 创建时的校验与冲突 ---');
show('POST 缺必填字段', await call('POST', '', { body: { name: '缺少 sku 和 price' } }));
show('POST 字段格式错误', await call('POST', '', {
  body: { sku: 'bad-sku', name: 'x', price: -1, stock: 1.5, tags: 'not-array' },
}));
show('POST SKU 重复', await call('POST', '', {
  body: { sku: 'KB-1001', name: '另一个键盘', price: 199 },
}));
console.log('  422 用于"格式对但值不合法"，400 用于"请求本身有问题"，409 用于"与现有资源冲突"。');
console.log('  校验错误里 details 数组精确指出了每个字段的问题，前端可以直接标在表单上。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 3. 列表：分页 / 过滤 / 排序 ---');
show('GET ?page=1&pageSize=2', await call('GET', '?page=1&pageSize=2'));
show('GET ?page=2&pageSize=2', await call('GET', '?page=2&pageSize=2'));
show('GET ?keyword=鼠标', await call('GET', '?keyword=%E9%BC%A0%E6%A0%87'));
show('GET ?tag=办公', await call('GET', '?tag=%E5%8A%9E%E5%85%AC'));
show('GET ?sort=price&order=desc', await call('GET', '?sort=price&order=desc'));
console.log('  total 与 totalPages 是前端渲染分页器的必需信息，列表接口一定要返回。');
console.log('');

console.log('--- 4. 非法查询参数 ---');
show('GET ?page=0', await call('GET', '?page=0'));
show('GET ?pageSize=100000', await call('GET', '?pageSize=100000'));
show('GET ?sort=password', await call('GET', '?sort=password'));
console.log('  pageSize 设上限是防御性设计：不限制的话一个请求就能让服务器内存爆掉。');
console.log('  sort 字段白名单可以防止"用排序参数探测内部字段"这类攻击。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 5. 详情：router.param 中间件的作用 ---');
show(`GET /${keyboard.id}`, await call('GET', `/${keyboard.id}`));
show('GET /99999（不存在）', await call('GET', '/99999'));
show('GET /abc（非法 id）', await call('GET', '/abc'));
console.log('  两种失败被 router.param 中间件区分开了：400（id 格式错）与 404（资源不存在）。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 6. PUT 整体替换 vs PATCH 局部更新 ---');
console.log(`  替换前：${JSON.stringify({ stock: keyboard.stock, tags: keyboard.tags })}`);
const putResult = await call('PUT', `/${keyboard.id}`, {
  body: { sku: 'KB-1001', name: '机械键盘（青轴）', price: 329 },
});
show('PUT（未传 stock 和 tags）', putResult);
console.log(`    可见 stock 回到了默认值 0、tags 变成空数组 —— 这就是 PUT 的"整体替换"语义。`);

const patchResult = await call('PATCH', `/${keyboard.id}`, { body: { price: 359 } });
show('PATCH（只传 price）', patchResult);
console.log(`    其他字段原样保留（name 仍是"机械键盘（青轴）"），这才是"局部更新"。`);
show('PATCH 空对象', await call('PATCH', `/${keyboard.id}`, { body: {} }));
console.log('  混用 PUT 与 PATCH 的语义是接口设计里最常见的错误之一。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 7. 更新时的冲突检测 ---');
show('PUT 把 sku 改成已存在的 MS-2002', await call('PUT', `/${keyboard.id}`, {
  body: { sku: 'MS-2002', name: '键盘', price: 100 },
}));
show('PATCH 把 sku 改成已存在的 MS-2002', await call('PATCH', `/${keyboard.id}`, { body: { sku: 'MS-2002' } }));
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 8. DELETE 与 204 状态码 ---');
show(`DELETE /${monitor.id}`, await call('DELETE', `/${monitor.id}`));
show(`DELETE /${monitor.id}（再删一次）`, await call('DELETE', `/${monitor.id}`));
show('GET 已删除的资源', await call('GET', `/${monitor.id}`));
console.log('  第二次删除返回 404 而不是 204 —— 本文件选择"如实反馈资源不存在"，');
console.log('  另一种设计是返回 204（幂等），两种都可以，重要的是团队内统一。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 9. 未知路由与不支持的方法 ---');
show('GET /api/v1/products/1/unknown', await call('DELETE', '/1/unknown'));
show('请求整个 API 之外的路径', await (async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/v2/other`);
  return { status: response.status, body: await response.json() };
})());
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 10. 最终的数据状态 ---');
const finalList = await call('GET', '?sort=id&order=asc');
console.log(`  共 ${finalList.body.data.pagination.total} 条商品：`);
for (const p of finalList.body.data.items) {
  console.log(`    #${p.id} ${p.sku} ${p.name} ¥${p.price} 库存 ${p.stock} 标签 ${JSON.stringify(p.tags)}`);
}
console.log('');

// ===========================================================================
// 第 5 部分：断言与清理
// ===========================================================================
console.log('--- 11. 自测断言 ---');

// 创建
assert.strictEqual(createdResults[0].status, 201);
assert.strictEqual(createdResults[0].body.success, true);
assert.strictEqual(keyboard.sku, 'KB-1001');
assert.strictEqual(mouse.price, 99.5);
assert.strictEqual(createdResults[0].headers.get('location'), `/api/v1/products/${keyboard.id}`);

// 校验与冲突
const missingFields = await call('POST', '', { body: { name: '缺少字段' } });
assert.strictEqual(missingFields.status, 422);
assert.strictEqual(missingFields.body.error.code, 'VALIDATION_ERROR');
assert.ok(Array.isArray(missingFields.body.error.details));
assert.ok(missingFields.body.error.details.length >= 2, '应一次返回多个字段的错误');
const conflict = await call('POST', '', { body: { sku: 'KB-1001', name: '冲突商品', price: 1 } });
assert.strictEqual(conflict.status, 409);
assert.strictEqual(conflict.body.error.code, 'SKU_CONFLICT');

// 分页与排序：先通过演示用的 _reset 接口把数据恢复到"3 条商品"的已知状态，
// 这样断言才不受前面 PUT/PATCH/DELETE 的影响 —— 测试要控制自己的前置条件。
await fetch(`http://127.0.0.1:${port}/api/v1/_reset`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seed: [
      { sku: 'KB-1001', name: '机械键盘', price: 299, stock: 50, tags: ['数码'] },
      { sku: 'MS-2002', name: '无线鼠标', price: 99.5, stock: 200, tags: ['数码'] },
      { sku: 'MN-3003', name: '显示器', price: 1299, stock: 10, tags: ['办公'] },
    ],
  }),
});

const page1 = await call('GET', '?page=1&pageSize=2');
assert.strictEqual(page1.status, 200);
assert.strictEqual(page1.body.data.items.length, 2, '第 1 页应有 2 条');
const page2 = await call('GET', '?page=2&pageSize=2');
assert.strictEqual(page2.status, 200);
assert.strictEqual(page2.body.data.items.length, 1, '第 2 页只剩 1 条（3 条数据、每页 2 条）');
assert.strictEqual(page2.body.data.pagination.page, 2);
assert.strictEqual(page2.body.data.pagination.total, 3);
assert.strictEqual(page2.body.data.pagination.totalPages, 2);
assert.strictEqual(page2.body.data.pagination.hasNext, false, '已是最后一页');
const sorted = await call('GET', '?sort=price&order=desc');
assert.strictEqual(sorted.body.data.items[0].price, 1299, '降序时最贵的应排第一');

// 非法参数
assert.strictEqual((await call('GET', '?page=0')).status, 400);
assert.strictEqual((await call('GET', '?pageSize=100000')).status, 400);
assert.strictEqual((await call('GET', '?sort=password')).status, 400);

// 详情与 router.param
assert.strictEqual((await call('GET', '/99999')).status, 404);
assert.strictEqual((await call('GET', '/abc')).status, 400);

// PUT vs PATCH
assert.strictEqual(putResult.body.data.stock, 0, 'PUT 未传 stock 应回到默认值');
assert.deepStrictEqual(putResult.body.data.tags, [], 'PUT 未传 tags 应回到空数组');
assert.strictEqual(patchResult.body.data.name, '机械键盘（青轴）', 'PATCH 不应清空未传字段');
assert.strictEqual(patchResult.body.data.price, 359);
assert.strictEqual((await call('PATCH', `/${keyboard.id}`, { body: {} })).status, 400);

// 冲突检测
assert.strictEqual((await call('PATCH', `/${keyboard.id}`, { body: { sku: 'MS-2002' } })).status, 409);

// 删除
assert.strictEqual((await call('DELETE', `/${monitor.id}`)).status, 204);
assert.strictEqual((await call('DELETE', `/${monitor.id}`)).status, 404);

console.log('  全部断言通过。');
console.log('');

// 关闭服务器
await new Promise((resolve) => server.close(resolve));
console.log(`--- 12. 服务器已关闭：server.listening = ${server.listening} ---`);
console.log('');
console.log('--- 13. 把内存存储换成真实数据库时，哪些代码不用改 ---');
console.log('  只需要重写 ProductStore（把 Map 换成 SQL/ORM 调用），');
console.log('  路由层、校验层、错误处理层完全不动 —— 这就是分层的价值。');
console.log('  进一步演进方向：');
console.log('    - 用 zod（见 05_zod_validation.js）替换手写的 validateProductBody；');
console.log('    - 加上鉴权中间件，把 userId 注入 req；');
console.log('    - 加上分页游标（cursor）替代 offset，避免深分页性能问题；');
console.log('    - 用 OpenAPI/Swagger 生成接口文档，或用 tRPC 获得端到端类型安全。');
console.log('');
console.log('演示结束。');
