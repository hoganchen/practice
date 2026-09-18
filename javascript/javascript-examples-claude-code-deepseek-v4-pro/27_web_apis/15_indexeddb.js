/**
 * ============================================================================
 * 知识点：IndexedDB —— 浏览器里的结构化数据库（Node 端手写迷你模拟器）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/05_web_storage.js（localStorage / Storage 接口）、
 *             27_web_apis/10_browser_storage_limits.js（容量与配额）、
 *             18_async/01_callbacks.js（回调与事件）、23_collections/01_map.js（Map/Set）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    IndexedDB 是浏览器内置的**事务型对象数据库**。它不是"键值对字符串仓库"
 *    （那是 localStorage），而是一个真正的数据库：
 *      - 库（database）：一个源下可以有多个库，每个库有版本号；
 *      - 对象仓库（object store）：相当于关系数据库里的"表"；
 *      - 记录（record）：以"键 → 值"的形式存放，值可以是任意结构化克隆得动的对象；
 *      - 索引（index）：为某个字段建二级索引，支持范围查询与排序；
 *      - 游标（cursor）：逐条遍历结果集；
 *      - 事务（transaction）：一串操作的原子单元，要么全成功，要么全回滚。
 *    整套 API 是**异步 + 事件回调**风格的（不是 Promise），这是它最劝退初学者的地方。
 *
 * 2. 为什么需要（localStorage 的三个天花板）
 *    ① 只能存字符串：存数组/对象必须 JSON.stringify，取出来还要 parse，大对象很痛。
 *    ② 同步 API 会卡界面：localStorage 的读写是阻塞主线程的，
 *       一次写几 MB 的 JSON 掉帧肉眼可见。
 *    ③ 容量小且没有查询能力：约 5MB，且只能"按键取整块"，
 *       想实现"找出 2000~2020 年出版、作者是张三的书"只能全量读出来自己筛。
 *    IndexedDB 三条全解：结构化克隆（直接存对象）、异步（不阻塞渲染）、
 *    大容量（通常按磁盘剩余空间的百分比分配，几百 MB 起步）+ 索引与游标查询。
 *
 * 3. 核心 API 速查
 *    // 1) 开库（版本号变了才会触发升级回调）
 *    const req = indexedDB.open('mydb', 2);
 *    req.onupgradeneeded = (e) => {          // 建仓库 / 建索引 / 数据迁移都在这里做
 *      const db = e.target.result;           // 这里拿到的是"升级中"的库
 *      const store = db.createObjectStore('books', { keyPath: 'isbn' });
 *      store.createIndex('by_author', 'author', { unique: false });
 *    };
 *    req.onsuccess = (e) => { const db = e.target.result; ... };
 *    req.onerror   = (e) => console.error(e.target.error);
 *
 *    // 2) 事务 + 增删改查（注意：事务是"用完即焚"的，不能存起来复用）
 *    const tx = db.transaction(['books'], 'readwrite');
 *    const store = tx.objectStore('books');
 *    store.add({ isbn: '978-7', title: 'JS 权威指南', author: 'Flanagan', year: 2020 });
 *    store.put({ ...改过的记录 });                 // 有则覆盖，无则新增
 *    const getReq = store.get('978-7');           // 返回值在 getReq.result 上
 *    store.delete('978-7');
 *    tx.oncomplete = () => console.log('事务提交成功');
 *    tx.onerror = tx.onabort = () => console.log('失败/回滚');
 *
 *    // 3) 游标遍历（openCursor 的 onsuccess 会被反复触发）
 *    const curReq = store.openCursor(IDBKeyRange.bound('a', 'z'), 'next');
 *    curReq.onsuccess = (e) => {
 *      const cursor = e.target.result;
 *      if (!cursor) return;              // null 表示遍历结束
 *      cursor.value / cursor.key / cursor.primaryKey;
 *      cursor.update(newValue); cursor.delete(); cursor.continue();
 *    };
 *
 *    // 4) 索引查询
 *    const idx = store.index('by_author');
 *    idx.get('张三'); idx.getAll(IDBKeyRange.bound(2000, 2020));
 *    idx.openCursor(); idx.count();
 *
 *    // 5) 键区间
 *    IDBKeyRange.only(k) / lowerBound(k, open) / upperBound(k, open) / bound(a, b, ao, bo)
 *
 * 4. 五个必须记住的语义
 *    ① **事务自动提交**：只要"没有新的请求挂进来"且事件队列空了，事务立刻提交。
 *       所以不能把 request 的 onsuccess 拿去 await 一个网络请求再继续用同一个事务
 *       ——中途事务早就提交了，再调用会抛 TransactionInactiveError。
 *    ② **错误会拖垮整个事务**：请求出错若没有调 event.preventDefault()，
 *       事务会整体 abort 并回滚，已经写入的数据全部撤销。
 *    ③ **取出来的是副本**：IndexedDB 存取都走结构化克隆，
 *       `store.get(k)` 拿到的是全新对象，改它不会影响库里的数据，必须 put 回去。
 *    ④ **升级只能升不能降**：open 传的版本号小于当前版本会抛 VersionError。
 *    ⑤ **游标 continue() 才算"下一个请求"**：这就是为什么游标循环里事务能保持活跃。
 *
 * 5. 常见陷阱
 *    - 忘了在 onupgradeneeded 里建仓库 → 之后 transaction() 抛 NotFoundError。
 *    - 升级时旧连接没关：新页面卡在 onblocked，必须让旧连接在 onversionchange 里
 *      `db.close()`（这是"用户刷新两次才生效"的经典成因之一）。
 *    - 把 db 和 tx 缓存在全局变量里跨函数复用 → 事务早已提交，报错难查。
 *    - Safari 无痕模式、Chrome 的 file:// 协议下 IndexedDB 可能直接不可用，
 *      必须做特性检测与降级（容错见 27_web_apis/10_browser_storage_limits.js）。
 *    - 键的类型很重要：数字 1 和字符串 '1' 是两个不同的键，排序规则也不同。
 *
 * 【本文件在 Node 中如何演示】
 *   Node 里没有 indexedDB 这个全局对象（它只存在于浏览器）。
 *   于是本文件用 Map + 数组**手写了一个迷你 IndexedDB**，把浏览器 API 的
 *   "形状"和"语义"都复刻出来：
 *     · 同名同形的 API：open / onupgradeneeded / transaction / objectStore /
 *       add / put / get / getAll / delete / clear / count / openCursor /
 *       createIndex / index / IDBKeyRange / 各种 *Error；
 *     · 真实的异步性：每个请求都走"任务队列"，用 await sleep(0) 让出事件循环，
 *       所以"请求是异步的、事务会自动提交"这两条语义是真的；
 *     · 真实的事务性：出错即回滚（未 preventDefault 时）、提交后才触发 oncomplete。
 *   用不到的东西（B-tree、磁盘落地、跨进程并发）当然没实现，
 *   但**用它写出来的业务代码，改成浏览器真 API 只需要把 `idb` 换回 `indexedDB`**。
 *
 * 【运行方法】
 *   node 27_web_apis/15_indexeddb.js
 *
 * 【预期输出】
 *   十个部分：localStorage 的天花板、IDBKeyRange 的区间语义、
 *   迷你 IndexedDB 的实现、开库建仓库、事务 CRUD、游标遍历、
 *   索引与范围查询、版本升级与迁移（含被阻塞的现场）、四类错误处理、
 *   Promise 封装与"该用哪个存储"的取舍表。
 * ============================================================================
 */

import { setTimeout as sleep } from 'node:timers/promises';

/** 分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

/** 造一个名字正确的错误（浏览器里这些是 DOMException，name 才是判断依据） */
function domError(name, message) {
  const err = new Error(message);
  err.name = name;
  return err;
}

/** 深拷贝，模拟结构化克隆（Node 17+ 的全局函数，与浏览器同源同实现） */
const clone = (value) => (value === undefined ? undefined : structuredClone(value));

// ===========================================================================
// 第 1 部分：localStorage 的三个天花板
// ===========================================================================

section('--- 1. 为什么需要 IndexedDB：localStorage 的三个天花板 ---');

console.log('天花板 ①：只能存字符串。');
const book = { isbn: '978-7-111-1', title: 'JavaScript 权威指南', year: 2020, tags: ['js', '参考'] };
console.log('  想存这个对象，必须先 JSON.stringify：');
console.log('    ' + JSON.stringify(book).slice(0, 60) + '...');
console.log('  取出来还要 JSON.parse，而且 Date 会退化成字符串、Map/Set 直接丢失。');
console.log('');
console.log('天花板 ②：读写是同步的，会阻塞主线程。');
console.log('  写 5MB 字符串时页面掉帧肉眼可见——因为它必须在主线程上跑完。');
console.log('');
console.log('天花板 ③：没有查询能力，也没有索引。');
console.log("  想查「2000~2020 年出版、作者是张三的书」，只能把全部数据读出来自己 filter。");
console.log('');
console.log('IndexedDB 三条全解：结构化克隆 + 全异步 + 索引/游标。');
console.log('但代价是 API 复杂度陡增：它是一套"事件回调式的事务型数据库"接口。');

// ===========================================================================
// 第 2 部分：IDBKeyRange —— 键的区间对象
// ===========================================================================

section('--- 2. IDBKeyRange：把"区间"做成一个对象 ---');

/**
 * IndexedDB 的键有严格的类型排序（跨类型也有序）：
 *   数字 < 日期 < 字符串 < 二进制 < 数组
 * 所以 IDBKeyRange 表达的区间是"在这个全序上的区间"。
 * 浏览器里 IDBKeyRange 是一个内置类，这里手写一个同名同形的版本。
 */
class IDBKeyRange {
  constructor(lower, upper, lowerOpen, upperOpen) {
    this.lower = lower;
    this.upper = upper;
    this.lowerOpen = lowerOpen; // true 表示不含下界（开区间）
    this.upperOpen = upperOpen;
  }

  /** 只有一个值：k <= x <= k，等价于范围查询里的 "=" */
  static only(value) {
    return new IDBKeyRange(value, value, false, false);
  }

  /** 下界：x >= lower（open=true 时是 x > lower） */
  static lowerBound(lower, open = false) {
    return new IDBKeyRange(lower, undefined, open, true);
  }

  /** 上界：x <= upper（open=true 时是 x < upper） */
  static upperBound(upper, open = false) {
    return new IDBKeyRange(undefined, upper, true, open);
  }

  /** 双边界：[lower, upper]，两个 open 分别控制是否排除端点 */
  static bound(lower, upper, lowerOpen = false, upperOpen = false) {
    return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
  }

  /** 判断某个键是否落在区间内 */
  includes(key) {
    if (this.lower !== undefined) {
      const c = compareKeys(key, this.lower);
      if (c < 0 || (c === 0 && this.lowerOpen)) return false;
    }
    if (this.upper !== undefined) {
      const c = compareKeys(key, this.upper);
      if (c > 0 || (c === 0 && this.upperOpen)) return false;
    }
    return true;
  }

  toString() {
    if (this.lower !== undefined && this.upper !== undefined) {
      if (this.lower === this.upper && !this.lowerOpen && !this.upperOpen) return 'only(' + this.lower + ')';
      return 'bound(' + this.lower + ', ' + this.upper + ')';
    }
    if (this.lower !== undefined) return 'lowerBound(' + this.lower + ')';
    return 'upperBound(' + this.upper + ')';
  }
}

/** 键的类型排序权重：数字 0 < 日期 1 < 字符串 2 < 二进制 3 < 数组 4 */
function keyTypeRank(key) {
  if (typeof key === 'number') return 0;
  if (key instanceof Date) return 1;
  if (typeof key === 'string') return 2;
  if (ArrayBuffer.isView(key) || key instanceof ArrayBuffer) return 3;
  if (Array.isArray(key)) return 4;
  return 5;
}

/** 按 IndexedDB 的规则比较两个键（负数表示 a 在前） */
function compareKeys(a, b) {
  const ra = keyTypeRank(a);
  const rb = keyTypeRank(b);
  if (ra !== rb) return ra - rb; // 类型不同先按类型排
  switch (ra) {
    case 0:
      return a - b; // 数字：按大小
    case 1:
      return a.getTime() - b.getTime(); // 日期：按时间戳
    case 2:
      return a < b ? -1 : a > b ? 1 : 0; // 字符串：按码元逐个比
    case 4: {
      // 数组：逐元素比较，短的在前
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) {
        const c = compareKeys(a[i], b[i]);
        if (c !== 0) return c;
      }
      return a.length - b.length;
    }
    default:
      return 0;
  }
}

console.log('键的全序：数字 < 日期 < 字符串 < 二进制 < 数组');
console.log("  compareKeys(5, '5')   →", compareKeys(5, '5'), '（数字类型永远排在字符串前面）');
console.log("  compareKeys('a', 'b') →", compareKeys('a', 'b'));
console.log('  注意：数字 1 与字符串 \'1\' 是**两个不同的键**，这也是常见困惑来源。');
console.log('');
const demoRange = IDBKeyRange.bound(2000, 2020, false, true);
console.log('const r = IDBKeyRange.bound(2000, 2020, false, true)  →', demoRange.toString());
for (const y of [1999, 2000, 2010, 2020, 2021]) {
  console.log('  r.includes(' + y + ') =', demoRange.includes(y), y === 2020 ? '← open 的上界，不含端点' : '');
}

// ===========================================================================
// 第 3 部分：迷你 IndexedDB —— 复刻浏览器 API 的形状与语义
// ===========================================================================

section('--- 3. 用 Map 手写迷你 IndexedDB（本文件的核心） ---');

/** 简化版 DOMStringList（objectStoreNames / indexNames 的类型） */
class NameList {
  constructor(names = []) {
    this._names = [...names];
  }

  get length() {
    return this._names.length;
  }

  item(i) {
    return this._names[i] ?? null;
  }

  contains(name) {
    return this._names.includes(name);
  }

  toArray() {
    return [...this._names];
  }

  [Symbol.iterator]() {
    return this._names[Symbol.iterator]();
  }
}

/** 每一个 store.add/get/... 都返回一个"请求对象"，结果异步出现在 request.result 上 */
class FakeRequest {
  constructor(source) {
    this.readyState = 'pending'; // 真实 IDB 里还有 'done'
    this.result = undefined;
    this.error = null;
    this.source = source; // 发起这个请求的 store / index / cursor
    this.onsuccess = null;
    this.onerror = null;
    this._tx = null; // 所属事务（内部用）
  }
}

/** open() 返回的是它，多两个回调：onupgradeneeded / onblocked */
class FakeOpenRequest extends FakeRequest {
  constructor() {
    super(null);
    this.onupgradeneeded = null;
    this.onblocked = null;
    this.transaction = null; // 升级期间指向版本变更事务
  }
}

/** 按 'a.b.c' 这样的键路径从对象里取值（IndexedDB 的 keyPath 支持点号路径） */
function getByPath(obj, path) {
  let cur = obj;
  for (const part of String(path).split('.')) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[part];
  }
  return cur;
}

/** 事务内的一个待执行操作 */
class FakeTransaction {
  constructor(db, storeNames, mode) {
    this.db = db;
    this.mode = mode; // 'readonly' | 'readwrite' | 'versionchange'
    this.objectStoreNames = new NameList(storeNames);
    this.error = null;
    this.oncomplete = null;
    this.onerror = null;
    this.onabort = null;
    this._queue = [];
    this._running = false;
    this._finished = false;
    this._stores = new Map();
    this._doneResolvers = [];
  }

  /** 内部：排一次队。即使一个请求都没有，空事务也会在这一轮之后自动提交 */
  _ensureDrain() {
    if (this._running || this._finished) return;
    this._running = true;
    setTimeout(() => this._drain(), 0);
  }

  /** 内部：等这个事务彻底结束（不管用户有没有挂 oncomplete） */
  _waitDone() {
    if (this._finished) return Promise.resolve();
    return new Promise((resolve) => this._doneResolvers.push(resolve));
  }

  /** 内部：通知所有等待者 */
  _notifyDone() {
    const list = this._doneResolvers;
    this._doneResolvers = [];
    for (const r of list) r();
  }

  /** 取对象仓库（同一个事务里多次调用返回同一个实例） */
  objectStore(name) {
    if (this._finished) throw domError('TransactionInactiveError', '事务已结束，不能再发起请求');
    if (!this.objectStoreNames.contains(name)) {
      throw domError('NotFoundError', "当前事务不包含对象仓库 '" + name + "'");
    }
    if (!this._stores.has(name)) {
      this._stores.set(name, new FakeObjectStore(this, this.db._storeData.get(name), name));
    }
    return this._stores.get(name);
  }

  /** 主动中止：所有排队中的操作作废，已做的修改全部回滚 */
  abort() {
    if (this._finished) return;
    // 回滚：把库里的数据恢复成事务开始时的快照
    this.db._restoreSnapshot(this._snapshot);
    this._queue.length = 0;
    this._finished = true;
    this.error = this.error ?? domError('AbortError', '事务被中止');
    if (this.onabort) this.onabort({ target: this });
    this._notifyDone();
  }

  /** 内部：把一个操作挂进事务队列 */
  _enqueue(request, fn) {
    if (this._finished) throw domError('TransactionInactiveError', '事务已结束，不能再发起请求');
    if (!this._snapshot) this._snapshot = this.db._takeSnapshot();
    request._tx = this;
    this._queue.push({ request, fn });
    if (!this._running) {
      this._running = true;
      // 关键：不在当前同步代码里执行，而是排进"任务队列"——
      // 这正是 IndexedDB "全异步" 的来源。
      setTimeout(() => this._drain(), 0);
    }
  }

  async _drain() {
    // 循环：排空队列 → 让出事件循环 → 如果队列仍然空，才提交。
    // "让出一次"很关键：真实的 IndexedDB 里，complete 事件是在最后一个请求的
    // success **之后另起一个任务**派发的；而且只要事务还没提交，
    // 调用方就仍然可以继续往里挂新请求（这正是"自动提交"的边界所在）。
    for (;;) {
      while (this._queue.length > 0) {
        const { request, fn } = this._queue.shift();
        await sleep(0); // 每个请求让出一次事件循环，模拟真实的异步节奏
        if (this._finished) return;
        try {
          request.result = fn();
          request.readyState = 'done';
          if (request.onsuccess) request.onsuccess({ target: request });
        } catch (err) {
          request.error = err;
          request.readyState = 'done';
          let handled = false;
          if (request.onerror) {
            // 真实 IDB：错误处理函数里调用 event.preventDefault() 才能"吃掉"这个错误，
            // 否则错误会冒泡到事务，导致整个事务 abort 回滚。
            request.onerror({
              target: request,
              preventDefault() {
                handled = true;
              },
            });
          }
          if (!handled) {
            this.error = err;
            this.abort();
            if (this.onerror) this.onerror({ target: this });
            return;
          }
          // 被吃掉的错误不影响事务继续
        }
      }
      await sleep(0);
      if (this._queue.length === 0) break;
    }
    this._finished = true;
    this.db._commitSnapshot();
    if (this.oncomplete) this.oncomplete({ target: this });
    this._notifyDone();
  }
}

/** 对象仓库：相当于关系库里的"表" */
class FakeObjectStore {
  constructor(tx, data, name) {
    this._tx = tx;
    this._data = data; // { records: [{key, value}] 按 key 排序, keyPath, autoIncrement, indexes: Map }
    this.name = name;
    this.keyPath = data.keyPath;
    this.indexNames = new NameList([...data.indexes.keys()]);
    this.autoIncrement = data.autoIncrement;
  }

  /** 建索引：升级期间调用，之后是只读的 */
  createIndex(name, keyPath, options = {}) {
    const db = this._tx.db;
    if (!db._inUpgrade) throw domError('InvalidStateError', '索引只能在 onupgradeneeded 里创建');
    if (this._data.indexes.has(name)) throw domError('ConstraintError', "索引 '" + name + "' 已存在");
    this._data.indexes.set(name, {
      name,
      keyPath,
      unique: Boolean(options.unique),
      multiEntry: Boolean(options.multiEntry),
    });
    this.indexNames = new NameList([...this._data.indexes.keys()]);
    return new FakeIndex(this, this._data.indexes.get(name));
  }

  deleteIndex(name) {
    if (!this._tx.db._inUpgrade) throw domError('InvalidStateError', '索引只能在 onupgradeneeded 里删除');
    this._data.indexes.delete(name);
    this.indexNames = new NameList([...this._data.indexes.keys()]);
  }

  index(name) {
    const def = this._data.indexes.get(name);
    if (!def) throw domError('NotFoundError', "没有名为 '" + name + "' 的索引");
    return new FakeIndex(this, def);
  }

  // ---------------------------------------------------------------- 增
  add(value, explicitKey) {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => this._write(value, explicitKey, false));
    return request;
  }

  // ---------------------------------------------------------------- 改
  put(value, explicitKey) {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => this._write(value, explicitKey, true));
    return request;
  }

  // ---------------------------------------------------------------- 查
  get(key) {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => {
      const rec = this._find(key);
      return rec ? clone(rec.value) : undefined; // 返回副本！
    });
    return request;
  }

  getAll(query, count) {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => this._matches(query, count).map((r) => clone(r.value)));
    return request;
  }

  getAllKeys(query, count) {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => this._matches(query, count).map((r) => r.key));
    return request;
  }

  count(query) {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => this._matches(query).length);
    return request;
  }

  // ---------------------------------------------------------------- 删
  delete(key) {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => {
      const i = this._data.records.findIndex((r) => compareKeys(r.key, key) === 0);
      if (i >= 0) this._data.records.splice(i, 1);
      return undefined;
    });
    return request;
  }

  clear() {
    const request = new FakeRequest(this);
    this._tx._enqueue(request, () => {
      this._data.records.length = 0;
      return undefined;
    });
    return request;
  }

  // ---------------------------------------------------------------- 游标
  openCursor(query, direction = 'next') {
    const request = new FakeRequest(this);
    const entries = this._matches(query).map((r) => ({ key: r.key, primaryKey: r.key, value: r.value }));
    if (direction === 'prev' || direction === 'prevunique') entries.reverse();

    const step = () => {
      // 游标每次 continue() 都是往事务队列里塞一个新请求 ——
      // 这就是"用游标遍历时事务能一直保持活跃"的原因。
      this._tx._enqueue(request, () => {
        const i = (request._cursorIndex ?? -1) + 1;
        request._cursorIndex = i;
        if (i >= entries.length) return null; // null 表示遍历结束
        return new FakeCursor(request, this, entries, i);
      });
    };
    step();
    return request;
  }

  // ---------------------------------------------------------------- 内部
  _find(key) {
    return this._data.records.find((r) => compareKeys(r.key, key) === 0);
  }

  _matches(query, count) {
    let list = this._data.records;
    if (query instanceof IDBKeyRange) list = list.filter((r) => query.includes(r.key));
    else if (query !== undefined && query !== null) {
      if (Array.isArray(query)) list = list.filter((r) => query.some((q) => compareKeys(r.key, q) === 0));
      else list = list.filter((r) => compareKeys(r.key, query) === 0);
    }
    return count === undefined ? list : list.slice(0, count);
  }

  /** add / put 的公共实现 */
  _write(value, explicitKey, overwrite) {
    if (this._tx.mode === 'readonly') throw domError('ReadOnlyError', '只读事务不能写入');
    if (value === null || typeof value !== 'object') {
      throw domError('DataError', '存入的值必须是对象（结构化克隆得动的东西）');
    }

    let key;
    if (this.keyPath) {
      key = getByPath(value, this.keyPath);
      if (explicitKey !== undefined) {
        throw domError('DataError', '对象仓库有 keyPath，不能再显式传键');
      }
      if (key === undefined) {
        if (!this.autoIncrement) throw domError('DataError', "记录里缺少 keyPath '" + this.keyPath + "'");
        key = this._data.nextKey++; // 自增生成器从 1 开始
        // 自增时把生成的键写回对象（真实 IDB 就是这么做的）
        const parts = String(this.keyPath).split('.');
        let cur = value;
        for (const p of parts.slice(0, -1)) cur = cur[p];
        cur[parts[parts.length - 1]] = key;
      }
    } else {
      key = explicitKey;
      if (key === undefined) {
        if (!this.autoIncrement) throw domError('DataError', '必须显式提供键（既没有 keyPath 也没开自动递增）');
        key = this._data.nextKey++;
      }
    }
    if (key === null || typeof key === 'object') throw domError('DataError', '键必须是数字/字符串/日期/二进制/数组');

    const existIndex = this._data.records.findIndex((r) => compareKeys(r.key, key) === 0);
    if (existIndex >= 0 && !overwrite) {
      throw domError('ConstraintError', '键 ' + JSON.stringify(key) + ' 已存在（add 不能覆盖，用 put）');
    }

    // 唯一索引冲突检查（真实 IndexedDB 也会在这里抛 ConstraintError）
    for (const def of this._data.indexes.values()) {
      if (!def.unique) continue;
      const newVal = getByPath(value, def.keyPath);
      if (newVal === undefined) continue;
      for (const rec of this._data.records) {
        if (existIndex >= 0 && rec === this._data.records[existIndex]) continue; // 覆盖自己不算冲突
        const oldVal = getByPath(rec.value, def.keyPath);
        if (oldVal !== undefined && compareKeys(oldVal, newVal) === 0) {
          throw domError('ConstraintError', "唯一索引 '" + def.name + "' 上已有值 " + JSON.stringify(newVal));
        }
      }
    }

    const record = { key: clone(key), value: clone(value) };
    if (existIndex >= 0) this._data.records[existIndex] = record;
    else {
      this._data.records.push(record);
      this._data.records.sort((a, b) => compareKeys(a.key, b.key)); // 主键始终有序 → 游标天然有序
    }
    // 返回写入用的键（真实 IDB 里 add() 的 request.result 就是这个键）
    const stored = this._data.records.find((r) => compareKeys(r.key, key) === 0);
    return clone(stored.key);
  }
}

/** 游标：逐条遍历结果集，可 update / delete / continue */
class FakeCursor {
  constructor(request, store, entries, index) {
    this._request = request;
    this._store = store;
    this._entries = entries;
    this._i = index;
  }

  get key() {
    return clone(this._entries[this._i].key);
  }

  get primaryKey() {
    return clone(this._entries[this._i].primaryKey);
  }

  get value() {
    return clone(this._entries[this._i].value);
  }

  /** 把当前记录改成新值 */
  update(newValue) {
    const req = new FakeRequest(this._store);
    const entry = this._entries[this._i];
    this._store._tx._enqueue(req, () => this._store._write(newValue, this._store.keyPath ? undefined : entry.primaryKey, true));
    return req;
  }

  /** 删除当前记录 */
  delete() {
    const req = new FakeRequest(this._store);
    const entry = this._entries[this._i];
    this._store._tx._enqueue(req, () => {
      const i = this._store._data.records.findIndex((r) => compareKeys(r.key, entry.primaryKey) === 0);
      if (i >= 0) this._store._data.records.splice(i, 1);
      return undefined;
    });
    return req;
  }

  /** 前进到下一条（也可以 advance(n) 跳 n 条） */
  continue() {
    this._store._tx._enqueue(this._request, () => {
      const next = this._i + 1;
      this._request._cursorIndex = next;
      if (next >= this._entries.length) return null;
      return new FakeCursor(this._request, this._store, this._entries, next);
    });
  }

  advance(n) {
    this._store._tx._enqueue(this._request, () => {
      const next = this._i + n;
      this._request._cursorIndex = next;
      if (next >= this._entries.length) return null;
      return new FakeCursor(this._request, this._store, this._entries, next);
    });
  }
}

/** 索引：为某个字段建的二级索引（真实实现是 B-tree，这里扫描 + 排序，语义一致） */
class FakeIndex {
  constructor(store, def) {
    this._store = store;
    this.name = def.name;
    this.keyPath = def.keyPath;
    this.unique = def.unique;
    this.multiEntry = def.multiEntry;
    this.objectStore = store;
  }

  /** 把所有记录投影成"索引键 → 主键"的条目列表，按索引键排序 */
  _entries() {
    const out = [];
    for (const rec of this._store._data.records) {
      const raw = getByPath(rec.value, this.keyPath);
      if (raw === undefined || raw === null) continue; // 没有该字段的记录不进索引
      const keys = this.multiEntry && Array.isArray(raw) ? raw : [raw];
      for (const k of keys) out.push({ key: k, primaryKey: rec.key, value: rec.value });
    }
    // 先按索引键排，索引键相同时按主键排 —— 与真实 IndexedDB 的规则一致
    out.sort((a, b) => compareKeys(a.key, b.key) || compareKeys(a.primaryKey, b.primaryKey));
    return out;
  }

  get(key) {
    const request = new FakeRequest(this);
    this._store._tx._enqueue(request, () => {
      const hit = this._entries().find((e) => compareKeys(e.key, key) === 0);
      return hit ? clone(hit.value) : undefined;
    });
    return request;
  }

  getAll(query, count) {
    const request = new FakeRequest(this);
    this._store._tx._enqueue(request, () => {
      let list = this._entries();
      if (query instanceof IDBKeyRange) list = list.filter((e) => query.includes(e.key));
      else if (query !== undefined && query !== null) list = list.filter((e) => compareKeys(e.key, query) === 0);
      if (count !== undefined) list = list.slice(0, count);
      return list.map((e) => clone(e.value));
    });
    return request;
  }

  getAllKeys(query, count) {
    const request = new FakeRequest(this);
    this._store._tx._enqueue(request, () => {
      let list = this._entries();
      if (query instanceof IDBKeyRange) list = list.filter((e) => query.includes(e.key));
      else if (query !== undefined && query !== null) list = list.filter((e) => compareKeys(e.key, query) === 0);
      if (count !== undefined) list = list.slice(0, count);
      return list.map((e) => e.primaryKey);
    });
    return request;
  }

  count(query) {
    const request = new FakeRequest(this);
    this._store._tx._enqueue(request, () => {
      let list = this._entries();
      if (query instanceof IDBKeyRange) list = list.filter((e) => query.includes(e.key));
      else if (query !== undefined && query !== null) list = list.filter((e) => compareKeys(e.key, query) === 0);
      return list.length;
    });
    return request;
  }

  /** 索引游标：cursor.key 是索引键，cursor.primaryKey 是主键 */
  openCursor(query, direction = 'next') {
    const request = new FakeRequest(this);
    let entries = this._entries();
    if (query instanceof IDBKeyRange) entries = entries.filter((e) => query.includes(e.key));
    else if (query !== undefined && query !== null) entries = entries.filter((e) => compareKeys(e.key, query) === 0);
    if (direction === 'prev') entries.reverse();

    this._store._tx._enqueue(request, () => {
      request._cursorIndex = 0;
      if (entries.length === 0) return null;
      return new FakeCursor(request, this._store, entries, 0);
    });
    return request;
  }
}

/** 数据库连接 */
class FakeDatabase {
  constructor(name, version, storeData) {
    this.name = name;
    this.version = version;
    this.objectStoreNames = new NameList([...storeData.keys()]);
    this.onversionchange = null;
    this.onclose = null;
    this._storeData = storeData; // Map<storeName, 数据>
    this._connections = 0;
    this._closed = false;
    this._inUpgrade = false;
    this._upgradeTxs = []; // 升级期间创建的事务，必须全部完成后才触发 open 的 success
  }

  /** 开一个事务。注意：事务用完即焚，不要缓存起来复用 */
  transaction(storeNames, mode = 'readonly') {
    if (this._closed) throw domError('InvalidStateError', '数据库连接已关闭');
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    for (const n of names) {
      if (!this._storeData.has(n)) {
        throw domError('NotFoundError', "对象仓库 '" + n + "' 不存在（是不是忘了在 onupgradeneeded 里建？）");
      }
    }
    const tx = new FakeTransaction(this, names, mode);
    // 空的读事务也会自动提交 —— 所以这里先排一次队，
    // 免得"什么都没做的事务"永远不触发 oncomplete。
    tx._ensureDrain();
    if (this._inUpgrade) this._upgradeTxs.push(tx); // 版本变更事务要等它做完才能算升级成功
    return tx;
  }

  createObjectStore(name, options = {}) {
    if (!this._inUpgrade) throw domError('InvalidStateError', '对象仓库只能在 onupgradeneeded 里创建');
    if (this._storeData.has(name)) throw domError('ConstraintError', "对象仓库 '" + name + "' 已存在");
    this._storeData.set(name, {
      records: [],
      keyPath: options.keyPath ?? null,
      autoIncrement: Boolean(options.autoIncrement),
      nextKey: 1,
      indexes: new Map(),
    });
    this.objectStoreNames = new NameList([...this._storeData.keys()]);
    return new FakeObjectStore(
      { db: this, mode: 'versionchange', _enqueue: (_r, fn) => fn(), objectStoreNames: this.objectStoreNames },
      this._storeData.get(name),
      name,
    );
  }

  deleteObjectStore(name) {
    if (!this._inUpgrade) throw domError('InvalidStateError', '对象仓库只能在 onupgradeneeded 里删除');
    this._storeData.delete(name);
    this.objectStoreNames = new NameList([...this._storeData.keys()]);
  }

  /** 关闭连接。升级被阻塞时，必须在 onversionchange 里调用它 */
  close() {
    if (this._closed) return;
    this._closed = true;
    this._connections = 0;
    this._dbRef._connections -= 1;
    if (this.onclose) this.onclose({ target: this });
  }

  // ---- 内部：事务回滚用的快照 ----
  _takeSnapshot() {
    return structuredClone([...this._storeData].map(([k, v]) => [k, { ...v, indexes: [...v.indexes] }]));
  }

  _restoreSnapshot(snapshot) {
    if (!snapshot) return;
    for (const [k, v] of snapshot) this._storeData.set(k, { ...v, indexes: new Map(v.indexes) });
  }

  _commitSnapshot() {
    /* 提交即"快照作废"，这里留个钩子便于讲解 */
  }
}

/** 整个 IndexedDB 命名空间 —— 浏览器里它就是全局的 window.indexedDB */
class MiniIndexedDB {
  constructor() {
    this._dbs = new Map(); // Map<name, {version, storeData}>
  }

  /**
   * 打开数据库。
   * 版本号 > 当前版本 → 触发 onupgradeneeded；
   * 版本号 < 当前版本 → 抛 VersionError；
   * 版本号省略 → 打开当前版本（库不存在则按版本 1 创建）。
   */
  open(name, version) {
    const request = new FakeOpenRequest();
    (async () => {
      await sleep(0); // 打开也是异步的
      const entry = this._dbs.get(name);
      const currentVersion = entry ? entry.version : 0;
      const target = version === undefined ? currentVersion || 1 : version;

      if (entry && target < currentVersion) {
        request.error = domError('VersionError', '不能把版本从 ' + currentVersion + ' 降到 ' + target);
        if (request.onerror) request.onerror({ target: request, preventDefault() {} });
        return;
      }

      // 需要升级时，先请所有旧连接让路
      if (entry && target > currentVersion) {
        for (const conn of entry.connections ?? []) {
          if (conn.onversionchange) conn.onversionchange({ target: conn, newVersion: target });
        }
        await sleep(0);
        const stillOpen = (entry.connections ?? []).filter((c) => !c._closed);
        if (stillOpen.length > 0) {
          // 真实浏览器里会一直等下去（页面看起来"卡住了"），这里选择显式告知
          if (request.onblocked) request.onblocked({ target: request, oldVersion: currentVersion, newVersion: target });
          request.error = domError('BlockedError', '还有 ' + stillOpen.length + ' 个连接没关闭，升级被阻塞');
          if (request.onerror) request.onerror({ target: request, preventDefault() {} });
          return;
        }
      }

      const storeData = entry ? entry.storeData : new Map();
      const db = new FakeDatabase(name, target, storeData);
      db._dbRef = { _connections: 0 };
      db._connections = 0;

      // 注意：升级回调里要用 event.target.result 拿到这个"升级中的库"，
      // 所以 request.result 必须在触发 onupgradeneeded 之前就赋好。
      request.result = db;
      request.readyState = 'done';

      if (target > currentVersion) {
        // ---- 版本变更：触发 onupgradeneeded，此时 db 是"升级中"状态 ----
        db._inUpgrade = true;
        const tx = {
          mode: 'versionchange',
          objectStoreNames: new NameList([...storeData.keys()]),
          abort: () => {},
          oncomplete: null,
        };
        request.transaction = tx;
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: request, oldVersion: currentVersion, newVersion: target });
        }
        db._inUpgrade = false;
        // 关键：版本变更事务必须全部成功，open 的 success 才会触发。
        // 迁移代码写在这里面，业务方 await 到 db 时数据一定已经就绪。
        for (const utx of db._upgradeTxs) await utx._waitDone();
        this._dbs.set(name, { version: target, storeData, connections: [] });
      }

      const record = this._dbs.get(name);
      record.connections.push(db);
      db._connections = 1;
      db._dbRef = record;
      if (request.onsuccess) request.onsuccess({ target: request });
    })();
    return request;
  }

  /** 删除整个库（会触发所有连接的 onversionchange） */
  deleteDatabase(name) {
    const request = new FakeRequest(null);
    (async () => {
      await sleep(0);
      this._dbs.delete(name);
      request.result = undefined;
      request.readyState = 'done';
      if (request.onsuccess) request.onsuccess({ target: request });
    })();
    return request;
  }

  /** 列出所有库名（真实 API 是 databases()，返回 Promise） */
  async databases() {
    return [...this._dbs.keys()].map((name) => ({ name, version: this._dbs.get(name).version }));
  }
}

/** 浏览器里这一行是：const idb = window.indexedDB; */
const idb = new MiniIndexedDB();
console.log('迷你 IndexedDB 已就绪，暴露的 API 与浏览器完全同名同形：');
console.log('  open / deleteDatabase / databases');
console.log('  FakeDatabase：transaction / createObjectStore / deleteObjectStore / close / onversionchange');
console.log('  FakeObjectStore：add / put / get / getAll / getAllKeys / delete / clear / count / openCursor / createIndex / index');
console.log('  FakeIndex：get / getAll / getAllKeys / count / openCursor');
console.log('  IDBKeyRange：only / lowerBound / upperBound / bound');
console.log('  再加上真实存在的结构化克隆（structuredClone）与真实的异步/事务语义。');

// ===========================================================================
// 第 4 部分：开库 + onupgradeneeded 建仓库与索引
// ===========================================================================

section('--- 4. 开库：open + onupgradeneeded 建仓库与索引 ---');

/** Promise 版开库（真实项目里几乎都会这么包一层） */
function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const req = idb.open(name, version);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('  ▶ onupgradeneeded 触发：' + event.oldVersion + ' → ' + event.newVersion);
      // 在这个回调里建仓库、建索引、做数据迁移
      if (!db.objectStoreNames.contains('books')) {
        const store = db.createObjectStore('books', { keyPath: 'isbn' });
        store.createIndex('by_author', 'author', { unique: false });
        store.createIndex('by_year', 'year', { unique: false });
        store.createIndex('by_title', 'title', { unique: true }); // 书名唯一
        console.log('    已建对象仓库 books(keyPath: isbn) 与 3 个索引：by_author / by_year / by_title');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => console.log('  ▶ onblocked：有旧连接没关，升级被阻塞');
  });
}

const db1 = await openDB('library', 1);
console.log('开库成功：db.name =', db1.name, '，db.version =', db1.version);
console.log('对象仓库列表 objectStoreNames =', db1.objectStoreNames.toArray());
{
  const tx = db1.transaction('books');
  const store = tx.objectStore('books');
  console.log('books 的主键路径 keyPath =', store.keyPath, '，索引 indexNames =', store.indexNames.toArray());
}
console.log('（提示：db.objectStoreNames 只是个名字列表，想看主键路径得进事务拿 store。）');

// ===========================================================================
// 第 5 部分：事务 + 增删改查
// ===========================================================================

section('--- 5. 事务 + 增删改查 ---');

/** 等一个请求成功（真实项目里用 idb 库的 promisify，这里手写等价物） */
function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => {
      event.preventDefault(); // 吃掉错误，别让它把整个事务拖垮
      reject(request.error);
    };
  });
}

/** 等事务提交（oncomplete 才代表真的落库） */
function txDone(tx) {
  return new Promise((resolve, reject) => {
    // 已经结束的事务不会再派发任何事件，必须先判一次，否则会永远等下去
    if (tx._finished) {
      if (tx.error) reject(tx.error);
      else resolve();
      return;
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? domError('AbortError', '事务被中止'));
  });
}

const BOOKS = [
  { isbn: '978-7-111-1', title: 'JavaScript 权威指南', author: 'Flanagan', year: 2020, price: 128 },
  { isbn: '978-7-111-2', title: 'JavaScript 高级程序设计', author: 'Zakas', year: 2019, price: 99 },
  { isbn: '978-7-111-3', title: '你不知道的 JavaScript', author: 'Simpson', year: 2018, price: 79 },
  { isbn: '978-7-111-4', title: '深入理解 ES6', author: 'Zakas', year: 2017, price: 89 },
  { isbn: '978-7-111-5', title: 'CSS 世界', author: '张鑫旭', year: 2018, price: 108 },
];

console.log('① 一次事务里连续 add 5 本书（注意：所有请求都在同一个事务里）：');
{
  const tx = db1.transaction('books', 'readwrite');
  const store = tx.objectStore('books');
  for (const b of BOOKS) {
    store.add(b); // 不 await：请求排队进事务，事务自动提交时才结束
  }
  await txDone(tx);
  console.log('    tx.oncomplete：事务提交，5 条记录已落库');
}
console.log('');

console.log('② 按主键读一条，并验证"取出来的是副本"：');
{
  const tx = db1.transaction('books');
  const got = await requestToPromise(tx.objectStore('books').get('978-7-111-1'));
  console.log('    get("978-7-111-1") →', got.title, '/', got.author, '/', got.year);
  got.title = '被我改坏了'; // 改副本
  const tx2 = db1.transaction('books');
  const again = await requestToPromise(tx2.objectStore('books').get('978-7-111-1'));
  console.log('    改完副本再读一次 →', again.title, '← 库里没变，IndexedDB 存取都走结构化克隆');
}
console.log('');

console.log('③ put 更新一条（put 有则覆盖、无则新增）：');
{
  // 先读、再写 —— 注意必须分成两个事务。
  // 若在同一个 readwrite 事务里「读 → await 别的东西 → 再写」，
  // 中间的 await 期间事务早就自动提交了，再写就会抛 TransactionInactiveError。
  const readTx = db1.transaction('books');
  const target = await requestToPromise(readTx.objectStore('books').get('978-7-111-3'));
  await txDone(readTx);

  target.price = 59; // 打折（改的是副本，所以必须 put 回去）
  const tx = db1.transaction('books', 'readwrite');
  await requestToPromise(tx.objectStore('books').put(target));
  await txDone(tx);

  const t2 = db1.transaction('books');
  const updated = await requestToPromise(t2.objectStore('books').get('978-7-111-3'));
  await txDone(t2);
  console.log('    put 之后 price =', updated.price, '← 从 79 变成 59');
}
console.log('');

console.log('④ count / getAll / getAllKeys / delete：');
{
  const tx = db1.transaction('books', 'readwrite');
  const store = tx.objectStore('books');
  console.log('    count() =', await requestToPromise(store.count()));
  console.log('    getAll() 返回', (await requestToPromise(store.getAll())).length, '条（按主键升序）');
  const keys = await requestToPromise(store.getAllKeys());
  console.log('    getAllKeys() = [' + keys.join(', ') + ']');
  await requestToPromise(store.delete('978-7-111-1'));
  console.log('    delete("978-7-111-1") 之后 count() =', await requestToPromise(store.count()));
  await txDone(tx);
}
console.log('');

console.log('⑤ 事务的原子性：中途出错 → 全部回滚：');
{
  // 先把"写入前"的记录数读出来（读操作放在自己的事务里），再开写入事务
  const countTx = db1.transaction('books');
  const before = await requestToPromise(countTx.objectStore('books').count());
  await txDone(countTx);

  const tx = db1.transaction('books', 'readwrite');
  const store = tx.objectStore('books');
  store.add({ isbn: '978-7-111-100', title: '临时书 A', author: '某人', year: 2024 });
  store.add({ isbn: '978-7-111-2', title: '撞主键的书', author: '某人', year: 2024 }); // 978-7-111-2 已存在
  tx.onabort = () => console.log('    tx.onabort：事务回滚，第 2 条冲突导致第 1 条也白写了');
  tx.onerror = () => {};
  await txDone(tx).catch(() => {});

  const afterTx = db1.transaction('books');
  const after = await requestToPromise(afterTx.objectStore('books').count());
  await txDone(afterTx);
  console.log('    写入前后记录数：' + before + ' → ' + after + (before === after ? '（回滚成功）' : '（居然变了？）'));
}

// ===========================================================================
// 第 6 部分：游标遍历
// ===========================================================================

section('--- 6. 游标遍历：openCursor + continue ---');

/** 把游标遍历包成 Promise，回调式的 API 手动转成 async 风格 */
function walkCursor(source, query, direction, onEach) {
  return new Promise((resolve, reject) => {
    const req = source.openCursor(query, direction);
    const tx = source._tx ?? source._store?._tx;
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (!cursor) return resolve(); // null = 遍历结束
      onEach(cursor);
      cursor.continue(); // 关键：continue 才会推进到下一条
    };
    req.onerror = (event) => {
      event.preventDefault();
      reject(req.error);
    };
    void tx;
  });
}

console.log('① 全表遍历（游标天然按主键升序）：');
{
  const tx = db1.transaction('books');
  const rows = [];
  await walkCursor(tx.objectStore('books'), undefined, 'next', (c) => rows.push(c.key + ' ' + c.value.title));
  await txDone(tx);
  for (const r of rows) console.log('    ' + r);
}
console.log('');

console.log('② 倒序遍历（direction = "prev"）：');
{
  const tx = db1.transaction('books');
  const rows = [];
  await walkCursor(tx.objectStore('books'), undefined, 'prev', (c) => rows.push(c.key));
  await txDone(tx);
  console.log('    主键倒序：' + rows.join(' → '));
}
console.log('');

console.log('③ 游标里 update / delete（改的是当前这一条）：');
{
  const tx = db1.transaction('books', 'readwrite');
  const store = tx.objectStore('books');
  const log = [];
  await walkCursor(store, IDBKeyRange.lowerBound('978-7-111-4'), 'next', (c) => {
    if (c.value.year < 2019) {
      log.push('删除 ' + c.value.title);
      c.delete();
    } else {
      const v = c.value;
      v.price = Math.round(v.price * 0.8); // 打八折
      log.push('打折 ' + v.title + ' → ' + v.price);
      c.update(v);
    }
  });
  await txDone(tx);
  for (const l of log) console.log('    ' + l);
}
console.log('');

console.log('④ 用 advance(n) 跳着遍历（每 2 条取 1 条）：');
{
  const tx = db1.transaction('books', 'readwrite');
  const store = tx.objectStore('books');
  // 先把书补齐到 6 本，便于观察
  await requestToPromise(store.add({ isbn: '978-7-111-6', title: '重学前端', author: 'winter', year: 2019, price: 68 }));
  await txDone(tx);

  const tx2 = db1.transaction('books');
  const req = tx2.objectStore('books').openCursor();
  const picked = [];
  await new Promise((resolve, reject) => {
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (!c) return resolve();
      picked.push(c.key);
      c.advance(2); // 跳过下一条
    };
    req.onerror = (e) => {
      e.preventDefault();
      reject(req.error);
    };
  });
  await txDone(tx2);
  console.log('    取到的主键：' + picked.join(', '));
}

// ===========================================================================
// 第 7 部分：索引查询与 IDBKeyRange 实战
// ===========================================================================

section('--- 7. 索引查询：index + IDBKeyRange ---');

/** 在一个只读事务里跑一段查询 */
async function query(fn) {
  const tx = db1.transaction('books');
  const result = await fn(tx.objectStore('books'), tx);
  await txDone(tx);
  return result;
}

console.log('① 索引点查：找出 Zakas 的书');
{
  const list = await query(async (store) => {
    const idx = store.index('by_author');
    return requestToPromise(idx.getAll('Zakas'));
  });
  for (const b of list) console.log('    ' + b.title + '（' + b.year + '）');
  console.log('    → index.getAll(值) 等价于对索引键做 IDBKeyRange.only(值)');
}
console.log('');

console.log('② 索引范围查：2018 ~ 2019 年出版（含两端）');
{
  const list = await query((store) =>
    requestToPromise(store.index('by_year').getAll(IDBKeyRange.bound(2018, 2019))),
  );
  for (const b of list) console.log('    ' + b.year + '  ' + b.title);
  console.log('    注意结果按**索引键**（year）排序，不是按主键。');
}
console.log('');

console.log('③ 索引游标：按年份倒序，只取前 3 本');
{
  const tx = db1.transaction('books');
  const idx = tx.objectStore('books').index('by_year');
  const req = idx.openCursor(undefined, 'prev');
  const out = await new Promise((resolve, reject) => {
    const acc = [];
    req.onsuccess = (e) => {
      const c = e.target.result;
      if (!c || acc.length >= 3) return resolve(acc);
      acc.push({ indexKey: c.key, primaryKey: c.primaryKey, title: c.value.title });
      c.continue();
    };
    req.onerror = (e) => {
      e.preventDefault();
      reject(req.error);
    };
  });
  await txDone(tx);
  for (const r of out) console.log('    索引键=' + r.indexKey + '  主键=' + r.primaryKey + '  ' + r.title);
  console.log('    索引游标里 cursor.key 是索引键、cursor.primaryKey 才是主键，别弄混。');
}
console.log('');

console.log('④ 四种 IDBKeyRange 对照（对 by_year 索引做 count）：');
{
  const ranges = [
    ['only(2019)', IDBKeyRange.only(2019)],
    ['lowerBound(2019)', IDBKeyRange.lowerBound(2019)],
    ['upperBound(2019)', IDBKeyRange.upperBound(2019)],
    ['bound(2018, 2020, true, false)', IDBKeyRange.bound(2018, 2020, true, false)],
  ];
  for (const [label, range] of ranges) {
    const n = await query((store) => requestToPromise(store.index('by_year').count(range)));
    console.log('    ' + label.padEnd(32) + ' → count = ' + n);
  }
  console.log('    open 参数（第 3/4 个）为 true 表示该端点是开区间，不含它。');
}
console.log('');

console.log('⑤ 唯一索引：by_title 上的重复写入会被拒绝');
{
  const tx = db1.transaction('books', 'readwrite');
  const req = tx.objectStore('books').add({ isbn: '978-7-111-7', title: '重学前端', author: '别人', year: 2021 });
  try {
    await requestToPromise(req);
    console.log('    居然成功了？');
  } catch (err) {
    console.log('    ✗ ' + err.name + '：' + err.message);
  }
  tx.onerror = () => {};
  await txDone(tx).catch(() => {});
  console.log('    在 onerror 里 preventDefault() 之后，这个错误不会拖垮整个事务。');
}

// ===========================================================================
// 第 8 部分：版本升级与迁移
// ===========================================================================

section('--- 8. 版本升级与迁移（v1 → v2 → v3） ---');

console.log('① 先看"忘记关连接"的现场：');
{
  // db1 还开着，直接升到 v2
  const blocked = await new Promise((resolve) => {
    const req = idb.open('library', 2);
    req.onupgradeneeded = () => console.log('    （不该走到这里）');
    req.onblocked = () => console.log('    ▶ onblocked：db1 这个旧连接没关，新页面就一直等着');
    req.onsuccess = () => resolve('opened');
    req.onerror = () => resolve('error');
  });
  console.log('    结果：' + blocked + '（真实浏览器里页面会一直卡住，用户只能刷新）');
  console.log('    正解：老连接的 onversionchange 里执行 db.close()。');
  db1.close();
  console.log('    已手动 db1.close()，下面再升一次。');
}
console.log('');

console.log('② 正常升级到 v2：新增一个对象仓库 + 一个新的多值索引');
{
  const db2 = await new Promise((resolve, reject) => {
    const req = idb.open('library', 2);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('    ▶ 升级 ' + event.oldVersion + ' → ' + event.newVersion);
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { autoIncrement: true }); // 不指定 keyPath，用自增主键
        console.log('      新增对象仓库 logs（自增主键）');
      }
      if (!db.objectStoreNames.contains('tags')) {
        const s = db.createObjectStore('tags', { keyPath: 'id' });
        s.createIndex('by_tag', 'tag', { unique: false });
        console.log('      新增对象仓库 tags + 索引 by_tag');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  console.log('    升级完成：db.version =', db2.version, '，stores =', db2.objectStoreNames.toArray());
  db2.close();
}
console.log('');

console.log('③ 升级时做数据迁移（给老记录补一个新字段）：');
{
  const db3 = await new Promise((resolve, reject) => {
    const req = idb.open('library', 3);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('    ▶ 升级 ' + event.oldVersion + ' → ' + event.newVersion + '，开始迁移数据');
      // keyPath 没变的仓库不用重建，直接开个事务改数据
      const tx = db.transaction('books', 'readwrite');
      const store = tx.objectStore('books');
      const cur = store.openCursor();
      let n = 0;
      cur.onsuccess = (e) => {
        const c = e.target.result;
        if (!c) return;
        n += 1;
        const v = c.value;
        if (v.currency === undefined) {
          v.currency = 'CNY'; // 新字段，老记录补默认值
          c.update(v);
        }
        c.continue();
        if (n === 1) console.log('      （游标在版本变更事务里同样可用）');
      };
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const tx = db3.transaction('books');
  const all = await requestToPromise(tx.objectStore('books').getAll());
  await txDone(tx);
  console.log('    迁移后抽查：', all.slice(0, 2).map((b) => b.title + '/' + b.currency).join('，'));
  console.log('    db3.version =', db3.version);
  console.log('④ 降版本会被拒绝：');
  try {
    await new Promise((resolve, reject) => {
      const req = idb.open('library', 1); // 已经是 v3 了
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    console.log('    不应该走到这里');
  } catch (err) {
    console.log('    ✗ ' + err.name + '：' + err.message);
  }
  console.log('    教训：升级逻辑必须写成"幂等 + 向前兼容"，因为用户可能从任意旧版本跳上来。');
  db3.close();
}

// ===========================================================================
// 第 9 部分：错误处理
// ===========================================================================

section('--- 9. 错误处理：IndexedDB 的四类典型错误 ---');

console.log('① ConstraintError —— 主键冲突（add 不能覆盖）');
{
  const db = await openDB('library');
  const tx = db.transaction('books', 'readwrite');
  const req = tx.objectStore('books').add({ isbn: '978-7-111-2', title: '撞主键', author: 'x', year: 2000 });
  try {
    await requestToPromise(req);
  } catch (err) {
    console.log('    ✗ ' + err.name + '：' + err.message);
  }
  tx.onerror = () => {};
  await txDone(tx).catch(() => {});
  db.close();
}
console.log('');

console.log('② NotFoundError —— 对象仓库或索引不存在（最常见：忘了在 onupgradeneeded 里建）');
{
  const db = await openDB('library');
  try {
    db.transaction('no_such_store');
  } catch (err) {
    console.log('    ✗ ' + err.name + '：' + err.message);
  }
  const tx = db.transaction('books');
  try {
    tx.objectStore('books').index('no_such_index');
  } catch (err) {
    console.log('    ✗ ' + err.name + '：' + err.message);
  }
  db.close();
}
console.log('');

console.log('③ InvalidStateError / TransactionInactiveError —— 事务用完即焚');
{
  const db = await openDB('library');
  const tx = db.transaction('books');
  console.log('    事务进行中，' + 'objectStore 可以正常取用：', typeof tx.objectStore('books').name);
  await txDone(tx); // 等它提交
  try {
    tx.objectStore('books'); // 提交之后再取 → 报错
  } catch (err) {
    console.log('    ✗ 提交后再用这个事务：' + err.name + '：' + err.message);
  }
  console.log('    这就是"不能把 tx 缓存到全局变量里跨 await 复用"的原因。');
  db.close();
}
console.log('');

console.log('④ DataError / 未处理错误会拖垮事务');
{
  const db = await openDB('library');
  const tx = db.transaction('books', 'readwrite');
  const store = tx.objectStore('books');
  store.add({ isbn: '978-7-111-8', title: '正常写入的一条', author: 'y', year: 2022 });
  store.add('我不是对象'); // 故意写错类型
  tx.onerror = () => console.log('    ▶ tx.onerror：' + tx.error.name + '（' + tx.error.message + '）');
  tx.onabort = () => console.log('    ▶ tx.onabort：事务回滚');
  await txDone(tx).catch(() => {});
  const t2 = db.transaction('books');
  const n = await requestToPromise(t2.objectStore('books').count());
  await txDone(t2);
  console.log('    回滚后的记录数 =', n, '← 前面那条"正常写入"也没留下');
  db.close();
}

// ===========================================================================
// 第 10 部分：Promise 封装 + 与 localStorage 的取舍
// ===========================================================================

section('--- 10. Promise 封装 + IndexedDB vs localStorage ---');

console.log('原生 API 是回调式的，真实项目里一般会包一层 Promise（或直接用 idb 库）：');
console.log('');
console.log('  // 浏览器中推荐的封装（idb 库的 API 形状）');
console.log('  const db = await openDB("library", 1);');
console.log('  const book = await db.get("books", "978-7-111-2");');
console.log('  await db.put("books", { ...book, price: 66 });');
console.log('  const list = await db.getAllFromIndex("books", "by_author", "Zakas");');
console.log('');
console.log('上面的 requestToPromise / txDone 两个小函数，就是这层封装的全部秘密。');
console.log('');

const compare = [
  ['数据结构', '只能是字符串（对象要 JSON.stringify）', '任意结构化克隆得动的对象（含 Date/Map/Set/Blob）'],
  ['API 风格', '同步（会阻塞主线程）', '异步（事件回调或 Promise）'],
  ['容量', '约 5MB', '按磁盘剩余空间比例分配，通常数百 MB 起'],
  ['查询能力', '只有 getItem 按键取整块', '索引、范围查询（IDBKeyRange）、游标遍历'],
  ['事务', '无', '有（原子提交 / 出错回滚）'],
  ['写入速度', '大数据量 JSON 解析极其低效', '结构化克隆 + 索引，量大时快一个数量级'],
  ['使用成本', '一行代码就能用', '回调地狱、版本迁移、错误处理都要自己写'],
];
console.log('该用哪个？');
for (const [dim, local, idbRow] of compare) {
  console.log('· ' + dim);
  console.log('    localStorage ：' + local);
  console.log('    IndexedDB    ：' + idbRow);
}
console.log('');
console.log('经验法则：');
console.log('  · 主题、语言、开关、几十字节的小配置 → localStorage，一行搞定；');
console.log('  · 离线数据、草稿箱、图片/文件缓存、上千条以上的结构化记录 → IndexedDB；');
console.log('  · 两者都不适合存敏感信息（都不加密），真正的密钥请交给服务端 + HttpOnly Cookie。');

section('小结');
console.log('1) IndexedDB 是"事务型对象数据库"，不是"大号 localStorage"。');
console.log('2) 一切都在 onupgradeneeded 里建：对象仓库、索引、数据迁移。');
console.log('3) 事务用完即焚、自动提交；未处理的请求错误会让整个事务回滚。');
console.log('4) 存取都走结构化克隆，拿到的永远是副本。');
console.log('5) 索引 + IDBKeyRange + 游标 = 真正的查询能力，这是它最大的价值。');
console.log('');
console.log('程序结束。');
