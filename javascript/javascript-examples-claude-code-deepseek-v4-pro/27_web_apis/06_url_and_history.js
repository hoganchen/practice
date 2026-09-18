/**
 * ============================================================================
 * 知识点：URL 与历史记录（Node 端用 node:url 演示同样的解析与构造）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/05_web_storage.js、11_strings/02_template_literals.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    URL（Uniform Resource Locator）是万维网上"资源地址"的标准写法。
 *    浏览器和 Node 都实现了同一套 WHATWG URL 标准：
 *      - URL 类：把地址字符串解析成结构化的各个部分，也能反向拼装。
 *      - URLSearchParams 类：专门处理 "?a=1&b=2" 这样的查询字符串。
 *      - History API：浏览器的历史记录栈（pushState / replaceState / popstate），
 *        是"单页应用（SPA）路由"的基石。
 *
 * 2. 为什么需要
 *    - 手写字符串拼接处理 URL 极其容易出错：中文要编码、空格要转成 %20、
 *      & 和 = 要转义、相对路径要拼接……URL 类全部帮你搞定。
 *    - 传统多页应用每点一个链接就整页刷新；SPA 用 History API 在不刷新页面的
 *      情况下改变地址栏并响应后退/前进按钮，这就是前端路由的原理。
 *
 * 3. 核心语法要点
 *    new URL(input, base?) 解析后的属性：
 *      href / protocol / username / password / host / hostname / port /
 *      pathname / search / hash / origin / searchParams
 *    注意 origin 是只读的，而 protocol / host / pathname / search / hash 可写。
 *    URLSearchParams 常用方法：
 *      get(k) / getAll(k) / has(k) / set(k,v) / append(k,v) / delete(k) /
 *      sort() / toString() / entries() / forEach()
 *    History API（浏览器）：
 *      history.pushState(state, '', url)  入栈一条新记录
 *      history.replaceState(state, '', url)  替换当前记录（不留历史）
 *      history.back() / forward() / go(n)
 *      history.length / history.state
 *      window.addEventListener('popstate', e => ...)  前进后退时触发
 *
 * 4. 常见陷阱
 *    - new URL('foo') 会直接抛 TypeError，必须有 base 参数或写成绝对地址。
 *    - searchParams.get('a') 只返回**第一个** a 的值；要全部拿到得用 getAll。
 *    - searchParams 的修改会立即反映到 URL 对象上（它们共享同一个底层数据），
 *      但不会自动触发页面跳转或历史记录。
 *    - history.pushState 只改地址栏和历史栈，**不会**刷新页面，也不会触发
 *      popstate/pushstate 事件；用 pushState 后如果需要渲染，得自己调渲染函数。
 *    - popstate 事件里拿到的 e.state 就是 pushState 时传的第一个参数。
 *    - 用 file:// 打开时 history.pushState 会因为跨源限制而抛错（SecurityError）。
 *    - encodeURI 与 encodeURIComponent 不一样：前者保留 :/?#&= 等分隔符，
 *      后者全部转义。拼查询参数要用后者。
 *
 * 【本文件在 Node 中如何演示】
 *    URL 和 URLSearchParams 在 Node 里是**内置全局对象**，与浏览器完全同一套实现，
 *    所以这部分代码可以直接互相拷贝使用。
 *    History API 则完全属于浏览器（它绑定在 window 上，涉及地址栏和历史栈 UI），
 *    Node 中没有对应物。本文件用一个 MiniHistory 类模拟同样的接口语义
 *    （栈、pushState/replaceState/back/forward、popstate 事件），
 *    并在注释里说明浏览器中的真实行为与之有什么不同。
 *
 * 【运行方法】
 *   node 27_web_apis/06_url_and_history.js
 *
 * 【预期输出】
 *   打印 URL 各部分的拆解、相对路径解析、查询参数的增删改查与编码，
 *   以及模拟 History 栈的 push/replace/back/forward 全过程。
 * ============================================================================
 */

import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// ===========================================================================
// 第 1 部分：URL 的结构
// ===========================================================================

console.log('--- 1. 一个 URL 由哪些部分组成 ---');

// URL 在 Node 与浏览器中都是全局可用的构造函数（WHATWG 标准）
const url = new URL('https://shop.example.com:8443/goods/list?cat=book&page=2&tag=js&tag=node#reviews');

console.log('  完整地址：' + url.href);
console.log('    protocol =', JSON.stringify(url.protocol), '（协议，注意带冒号）');
console.log('    username =', JSON.stringify(url.username));
console.log('    password =', JSON.stringify(url.password));
console.log('    host     =', JSON.stringify(url.host), '（主机名 + 端口）');
console.log('    hostname =', JSON.stringify(url.hostname), '（只有主机名）');
console.log('    port     =', JSON.stringify(url.port), '（协议默认端口会被省略）');
console.log('    pathname =', JSON.stringify(url.pathname));
console.log('    search   =', JSON.stringify(url.search), '（含问号）');
console.log('    hash     =', JSON.stringify(url.hash), '（含井号，即"锚点"）');
console.log('    origin   =', JSON.stringify(url.origin), '（协议 + 主机 + 端口，只读）');
console.log('');

console.log('  一些边界情况：');
console.log('    默认端口会被省略：new URL("https://a.com:443/x").host =', JSON.stringify(new URL('https://a.com:443/x').host));
console.log('    非默认端口会保留：new URL("https://a.com:8443/x").host =', JSON.stringify(new URL('https://a.com:8443/x').host));
console.log('    地址里的中文会被自动编码：new URL("https://a.com/搜索?q=中文").pathname =', JSON.stringify(new URL('https://a.com/搜索?q=中文').pathname));
console.log('    file 协议的 origin 是 "null"：', JSON.stringify(new URL('file:///c:/a/b.txt').origin));
console.log('');

// ===========================================================================
// 第 2 部分：相对路径解析
// ===========================================================================

console.log('--- 2. 相对路径：new URL(相对, 基准) ---');

const base = 'https://example.com/a/b/index.html';
const relatives = ['c.html', './c.html', '../c.html', '/root.html', '//cdn.example.com/x.js', '?q=1', '#top'];

for (const rel of relatives) {
  // 第二个参数是"基准地址"。浏览器里 location.href 就是天然的基准。
  console.log('  new URL(' + JSON.stringify(rel) + ', base).href = ' + new URL(rel, base).href);
}
console.log('');
console.log('  陷阱：只传一个相对地址会直接抛错：');
try {
  new URL('foo/bar'); // 没有基准，无法知道完整地址
} catch (err) {
  console.log('    new URL("foo/bar") → ' + err.name + ': ' + err.message);
  console.log('    浏览器里这个错误通常发生在拼接接口地址时忘了 base。');
}
console.log('');

// ===========================================================================
// 第 3 部分：URLSearchParams 查询字符串
// ===========================================================================

console.log('--- 3. URLSearchParams：查询字符串的正确打开方式 ---');

const params = url.searchParams; // 直接从 URL 上取，二者是"同一个数据的两个视图"
console.log('  原始 search =', JSON.stringify(url.search));
console.log("  get('cat')    =", JSON.stringify(params.get('cat')));
console.log("  get('page')   =", JSON.stringify(params.get('page')), '（值永远是字符串）');
console.log("  get('nope')   =", JSON.stringify(params.get('nope')), '（不存在返回 null）');
console.log("  has('tag')    =", params.has('tag'));

// 重复键：get 只返回第一个，getAll 才能拿全
console.log("  get('tag')    =", JSON.stringify(params.get('tag')), '← 只返回第一个');
console.log("  getAll('tag') =", JSON.stringify(params.getAll('tag')), '← 全部（这是复选框组提交时的常见形态）');
console.log('');

console.log('  增删改：');
params.set('page', '3'); // 有则改，无则加
params.append('tag', 'http'); // 永远追加（会造出重复键）
params.append('sort', 'price');
params.delete('cat'); // 删除某个键（所有同名键一起删）
console.log("    set('page','3') / append('tag','http') / append('sort','price') / delete('cat') 之后：");
console.log('    toString() =', params.toString());
console.log('    注意 URL 的 search 也同步变了 →', JSON.stringify(url.search), '（共享同一份数据）');
console.log('');

console.log('  遍历：');
params.forEach((value, key) => {
  console.log('    ' + key + ' = ' + value);
});
console.log('  entries() 转数组：', JSON.stringify([...params.entries()]));
params.sort(); // 按键名排序（同一个键的多个值保持相对顺序）
console.log('  sort() 之后：' + params.toString());
console.log('');

console.log('  只用字符串（不用 URLSearchParams）时麻烦在哪：');
const rawQuery = 'q=%E4%B8%AD%E6%96%87&tags=a&tags=b&empty=';
console.log('    原始字符串：' + rawQuery);
const manual = {};
for (const pair of rawQuery.split('&')) {
  const i = pair.indexOf('=');
  manual[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
}
console.log('    手写解析结果：', manual, '← 重复键 tags 直接丢了第二个！');
const p2 = new URLSearchParams(rawQuery);
console.log("    URLSearchParams：get('q') =", JSON.stringify(p2.get('q')), '，getAll(\'tags\') =', JSON.stringify(p2.getAll('tags')));
console.log('    结论：解析查询串一定要用 URLSearchParams，手写会丢重复键、漏编码。');
console.log('');

// ===========================================================================
// 第 4 部分：构造与修改 URL
// ===========================================================================

console.log('--- 4. 构造 URL：从零拼一个带查询参数的地址 ---');

const api = new URL('https://api.example.com/v1/search');
// 用 searchParams 追加参数，中文与特殊字符会被自动转义
api.searchParams.set('keyword', '中文 & 符号');
api.searchParams.set('page', '1');
console.log('  构造结果：' + api.href);
console.log('  （中文和 & 都变成了百分号编码，这样才是合法的 URL）');
console.log('');

// 协议、主机、路径都可以直接赋值修改
api.protocol = 'http:';
api.hostname = 'test.example.com';
api.port = '8080';
api.pathname = '/v2/search';
api.hash = '#results';
console.log('  修改各部件后：' + api.href);
console.log('  注意：origin 是只读的，改它不会生效（会被静默忽略）。');
console.log('');

console.log('--- 5. 编码：encodeURI vs encodeURIComponent ---');
const tricky = 'a b&c=d/中文';
console.log('  原字符串：' + tricky);
console.log('  encodeURI          →', encodeURI(tricky));
console.log('  encodeURIComponent →', encodeURIComponent(tricky));
console.log('  区别：encodeURI 保留 :/?#&= 等分隔符（适合整条 URL），');
console.log('        encodeURIComponent 把它们也转义（适合单个参数值）。');
console.log('  所以拼参数值要用 encodeURIComponent，用错会导致参数被截断。');
console.log('');

// ===========================================================================
// 第 6 部分：Node 专有 —— 文件路径与 file:// URL 的互转
// ===========================================================================

console.log('--- 6. Node 专有：import.meta.url 与文件路径互转 ---');

// 浏览器里 __filename 不存在；Node 的 ESM 里用 import.meta.url 拿到当前文件的 file:// URL
console.log('  import.meta.url =', import.meta.url);
console.log('  fileURLToPath() =', fileURLToPath(import.meta.url), '（转成系统路径）');
console.log('  path.dirname()  =', path.dirname(fileURLToPath(import.meta.url)));
console.log('  pathToFileURL() =', pathToFileURL('C:/tmp/测试 文件.txt').href);
console.log('  Windows 路径里的反斜杠和空格会被正确转义。');
console.log('');

// ===========================================================================
// 第 7 部分：History API（浏览器有，Node 没有 → 手写模拟）
// ===========================================================================

console.log('--- 7. History API：Node 里没有，手写一个模拟实现 ---');

/**
 * 模拟浏览器的 History + popstate 事件。
 *
 * 浏览器中的真实行为：
 *   - history 绑定在 window 上，直接操作地址栏和浏览器的前进/后退按钮。
 *   - pushState 之后地址栏立刻变，但页面**不会**刷新，也不会触发任何事件。
 *   - 用户点后退/前进（或调 back()/forward()/go()）时才会派发 popstate。
 *   - file:// 协议下 pushState 会因跨源限制抛 SecurityError。
 * Node 里没有地址栏、没有会话历史，所以下面用数组 + EventEmitter 复刻这套语义。
 */
class MiniHistory {
  constructor(initialUrl) {
    this._stack = [{ state: null, url: initialUrl, title: '' }]; // 历史记录栈
    this._index = 0; // 当前处在栈中的位置
    this._listeners = new Map();
  }

  /** 对应 history.length：栈里记录总数（浏览器里含不可访问的更早记录） */
  get length() {
    return this._stack.length;
  }

  /** 对应 history.state：当前记录的 state 对象 */
  get state() {
    return this._stack[this._index].state;
  }

  /** 当前地址（浏览器里就是 location.href） */
  get currentUrl() {
    return this._stack[this._index].url;
  }

  /**
   * 对应 history.pushState(state, title, url)：入栈一条新记录。
   * 关键：它不会触发 popstate，也不会"导航"，页面要自己重新渲染。
   */
  pushState(state, title, url) {
    // 浏览器会丢弃"当前记录之后"的所有记录（前进历史被覆盖）
    this._stack = this._stack.slice(0, this._index + 1);
    this._stack.push({ state, url, title });
    this._index = this._stack.length - 1;
  }

  /** 对应 history.replaceState：替换当前记录，不新增历史 */
  replaceState(state, title, url) {
    this._stack[this._index] = { state, url, title };
  }

  /** 对应 history.back()：相当于 go(-1) */
  back() {
    return this.go(-1);
  }

  /** 对应 history.forward()：相当于 go(1) */
  forward() {
    return this.go(1);
  }

  /** 对应 history.go(n)：正数前进、负数后退、0 表示重新加载当前页 */
  go(delta) {
    const target = this._index + delta;
    if (target < 0 || target >= this._stack.length) {
      // 浏览器里越界时静默什么都不做
      return false;
    }
    this._index = target;
    // 只有"跳转历史"时才派发 popstate，这正是浏览器里的时机
    this._emit('popstate', { state: this.state, url: this.currentUrl });
    return true;
  }

  addEventListener(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(handler);
  }

  _emit(type, payload) {
    for (const fn of this._listeners.get(type) || []) fn(payload);
  }

  /** 便于调试：把整个历史栈画出来 */
  dump() {
    return this._stack.map((r, i) => (i === this._index ? `[${i}]* ${r.url}` : `[${i}]  ${r.url}`)).join('\n         ');
  }
}

const history = new MiniHistory('https://app.example.com/');
let renderCount = 0;

/** 模拟前端路由的"渲染"函数 */
function render(url) {
  renderCount += 1;
  console.log(`          → 第 ${renderCount} 次渲染页面，当前地址：${url}`);
}

// 浏览器里：window.addEventListener('popstate', e => { ... })
history.addEventListener('popstate', (e) => {
  console.log('          [popstate 事件] state =', JSON.stringify(e.state), '，地址 =', e.url);
  render(e.url); // 真实项目里这里会调用路由库的渲染逻辑
});

console.log('  初始状态：length =', history.length, '，state =', JSON.stringify(history.state));
console.log('');

console.log("  pushState 进入首页列表（SPA 里点导航链接的等价动作）：");
history.pushState({ page: 'list' }, '', 'https://app.example.com/goods');
render(history.currentUrl); // pushState 不会触发渲染，要手动调
console.log('    length =', history.length, '，state =', JSON.stringify(history.state));
console.log('    stack:' + history.dump());
console.log('');

console.log("  pushState 进入详情页：");
history.pushState({ page: 'detail', id: 42 }, '', 'https://app.example.com/goods/42?from=list');
render(history.currentUrl);
console.log('    length =', history.length, '，state =', JSON.stringify(history.state));
console.log('    stack:' + history.dump());
console.log('');

console.log("  replaceState 换掉当前记录（比如把临时筛选条件写进地址，但不留历史）：");
history.replaceState({ page: 'detail', id: 42, tab: 'reviews' }, '', 'https://app.example.com/goods/42?tab=reviews');
console.log('    length 仍然是', history.length, '（replace 不新增记录）');
console.log('    stack:' + history.dump());
console.log('');

console.log('  用户点了浏览器的「后退」按钮 → history.back()：');
history.back();
console.log('    当前地址 =', history.currentUrl, '，state =', JSON.stringify(history.state));
console.log('');

console.log('  用户点了「前进」→ history.forward()：');
history.forward();
console.log('    当前地址 =', history.currentUrl, '，state =', JSON.stringify(history.state));
console.log('');

console.log('  go(-2) 一次后退两步：');
history.go(-2);
console.log('');

console.log('  越界（在栈底继续后退）：go(-1) 返回', history.go(-1), '（浏览器里也是静默无动作）');
console.log('');

console.log('  最终历史栈：');
console.log('    ' + history.dump());
console.log('');

console.log('--- 8. 浏览器中 History 与 Node 的关键差异 ---');
console.log('  1) 浏览器里 history 绑定在 window 上，操作的是真实的地址栏和前进/后退按钮；');
console.log('     Node 里没有"地址栏"这个概念，所以只能自己维护一个数组。');
console.log('  2) 浏览器里 pushState 后地址栏立刻变化但页面不刷新；');
console.log('     这里的 url 只是记录在数组里，用日志打印出来模拟地址栏。');
console.log('  3) 浏览器里 popstate 由用户操作（或 back/forward/go）触发；');
console.log('     这里由 MiniHistory.go() 手动派发，时机与浏览器一致。');
console.log('  4) 浏览器里 hash 变化还会触发 hashchange 事件，这也是前端路由的一种实现');
console.log('     （hash 路由不需要服务器配合，pushState 路由需要服务器把所有路径都返回 index.html）。');
console.log('  5) 用 file:// 打开页面时，history.pushState 会抛 SecurityError，');
console.log('     本地调试 SPA 必须起一个 HTTP 服务器。');
console.log('');
console.log('程序结束。URL / URLSearchParams 部分在浏览器里可以原样运行，');
console.log('History 部分请对照同名 .html 中的浏览器真实实现。');
