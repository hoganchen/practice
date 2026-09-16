/**
 * ============================================================================
 * 知识点：URL 与 URLSearchParams —— 解析、构造与查询参数操作
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】入门
 * 【前置知识】26_node_core/02_path_module.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    URL 与 URLSearchParams 是 WHATWG（Web 超文本应用技术工作组）标准定义的
 *    两个全局类，浏览器和 Node.js 都原生提供，不需要 import。
 *    - URL：把一个 URL 字符串拆成 protocol / host / pathname / search / hash 等字段，
 *           并支持直接读写这些字段，再把结果重新序列化成字符串。
 *    - URLSearchParams：专门处理查询字符串（?a=1&b=2），提供 get/set/append/delete 等方法。
 *
 * 2. 为什么需要
 *    自己用字符串 split('?')、split('&') 解析 URL 极其容易出错：
 *    参数值里本身就含 '&' 怎么办？空格、中文该不该编码？'%20' 与 '+' 是同一个意思吗？
 *    同一个 key 出现两次该取哪个？重复的 '//'、'./' 在路径里算不算一回事？
 *    这些边界情况 WHATWG 标准都定义清楚了，直接用它就不会踩坑。
 *    Node.js 还有一套旧的 node:url API（url.parse / url.format），
 *    现已不推荐使用，新代码统一用全局的 URL。
 *
 * 3. 核心语法要点
 *    - new URL(input, base?)     解析；base 提供时 input 可以是相对路径
 *    - url.protocol / username / password / host / hostname / port
 *      / pathname / search / searchParams / hash / origin  都是可读可写属性
 *    - url.toString() / url.href 序列化回字符串（两者等价）
 *    - new URLSearchParams(str | obj | entries)
 *    - sp.get(k) / getAll(k) / has(k) / set(k,v) / append(k,v) / delete(k) / sort()
 *    - sp.toString()             编码成 'a=1&b=2'
 *    - [...sp] / sp.entries() / sp.forEach()  遍历
 *    - encodeURIComponent / decodeURIComponent   手动编解码单个片段
 *    - 静态方法：URL.canParse(input, base?)     安全探测能否解析，不抛异常
 *
 * 4. 常见陷阱
 *    陷阱 1：URL 对象是**活的**。改 url.pathname 之后再读 url.href，得到的是新值；
 *            反过来改 searchParams 也会立刻反映到 url.search 上。别以为它是一份快照。
 *    陷阱 2：url.searchParams.set() 会**覆盖**同名参数；要保留多个同名值必须用 append()。
 *    陷阱 3：url.search 是带 '?' 的（含问号），url.searchParams.toString() 是不带的。
 *            拼接时重复加 '?' 是常见 bug。
 *    陷阱 4：解析失败会抛 TypeError，不是返回 null。要么 try/catch，要么先用 URL.canParse 探测。
 *    陷阱 5：构造 URL 时若只传相对路径而没传 base，会抛 "Invalid URL"。
 *    陷阱 6：pathname 上的 '..' 会被自动折叠，这是标准行为而不是 bug。
 *    陷阱 7：读 query 得到的永远是字符串，'?page=2' 读出来是 '2' 而不是 2。
 *    陷阱 8：URLSearchParams 遵循 form-urlencoded 编码：空格序列化成 '+'，而 '+'
 *            本身解码成空格。于是 'q=a+b' 与 'q=a%20b' 解析结果相同、序列化后都是
 *            'q=a+b'——原始文本不同但语义相同。比较参数要比较解析后的键值。
 *    陷阱 9：URL 里的连续斜杠 '//' **不会**被折算，这与 path.normalize 的行为不同。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/03_url_module.js
 *
 * 【预期输出】
 *   演示 URL 各部件解析、相对路径解析、URLSearchParams 的增删改查与遍历、
 *   路径规范化与编码行为，以及几个常见陷阱的实测结果。
 * ============================================================================
 */

// URL 与 URLSearchParams 是 Node 的全局类（来自 WHATWG 标准），无需 import。
// 这里写一行注释说明即可：全局可用是标准的一部分，不是 Node 的扩展。

// ---------------------------------------------------------------------------
// 1. 把一个 URL 拆开看
// ---------------------------------------------------------------------------

console.log('--- 1. 解析 URL 的各个部件 ---');

const full =
  'https://user:pass@api.example.com:8443/v1/users/42?role=admin&tag=js&tag=node#section-2';

// new URL(...) 会把字符串解析成结构化对象。
// 注意这是全局构造函数，不是从模块里导入的。
const u = new URL(full);

// href 是完整的序列化结果（与 toString() 完全等价）。
console.log('href        =', u.href);

// protocol 带冒号，且会被规范化为小写。
console.log('protocol    =', u.protocol);

// username / password 是 URL 里的用户信息部分（不常用，但标准里有）。
console.log('username    =', u.username);
console.log('password    =', u.password);

// host = hostname + ':' + port，端口是默认端口时会被省略。
console.log('host        =', u.host);

// hostname 只有主机名，不含端口。
console.log('hostname    =', u.hostname);

// port 是字符串（不是数字），没显式写端口时是空串 ''。
console.log('port        =', JSON.stringify(u.port), '类型：', typeof u.port);

// pathname 是路径部分，一定以 '/' 开头。
console.log('pathname    =', u.pathname);

// search 包含开头的 '?'，这是最容易记错的一点。
console.log('search      =', u.search);

// hash 包含开头的 '#'。
console.log('hash        =', u.hash);

// origin 是协议 + 主机 + 端口，不包含路径。
// 跨域判断（CORS）比的就是 origin。
console.log('origin      =', u.origin);

// searchParams 是一个 URLSearchParams 对象，见第 3 节。
console.log('searchParams 类型 =', u.searchParams.constructor.name);

// ---------------------------------------------------------------------------
// 2. URL 对象是"活的"——写入即生效
// ---------------------------------------------------------------------------

console.log('--- 2. 修改 URL 部件 ---');

// 直接给属性赋值即可，URL 会立刻重新序列化。
// 注意这会自动做百分号编码：空格变成 %20，中文也会被编码。
u.pathname = '/v2/users/中文名';
console.log('修改 pathname 后 href =', u.href);
console.log('pathname 读回来 =', u.pathname, '（自动编码成 %E4%B8%AD...）');

// port 赋值同样生效。
u.port = '9443';
console.log('修改 port 后 host =', u.host);

// hash 赋值时写不写 '#' 都行，标准会补上。
u.hash = 'top';
console.log('修改 hash 后 href 末尾 =', u.href.slice(-10));

// 改 searchParams 会同步反映到 search 上——它们共享同一份数据。
u.searchParams.set('page', '3');
console.log('改 searchParams 后 search =', u.search);

// 反过来也一样：整体替换 search 会让 searchParams 跟着变。
u.search = '?mode=debug';
console.log('整体替换 search 后 searchParams.get("mode") =', u.searchParams.get('mode'));
console.log('原参数 role 还在吗：', u.searchParams.has('role'), '（被整体替换掉了）');

// 把 URL 还原成字符串：toString() 与 href 等价。
console.log('最终 href =', u.toString());

// ---------------------------------------------------------------------------
// 3. 用 base 解析相对路径
// ---------------------------------------------------------------------------

console.log('--- 3. 相对路径解析（base 参数） ---');

// 第二个参数 base 提供"基准地址"，第一个参数就可以是相对路径。
// 这与浏览器里 <a href="../x"> 的解析规则**完全一致**。
const base = 'https://example.com/docs/guide/intro.html';

console.log('基准 =', base);
console.log('"./setup.html"     ->', new URL('./setup.html', base).href);
console.log('"setup.html"       ->', new URL('setup.html', base).href);
console.log('"../api/ref.html"  ->', new URL('../api/ref.html', base).href);
console.log('"../../index.html" ->', new URL('../../index.html', base).href);
console.log('"/root.html"       ->', new URL('/root.html', base).href, '（以 / 开头回到根）');
console.log('"//cdn.net/a.js"   ->', new URL('//cdn.net/a.js', base).href, '（// 开头只换主机）');
console.log('"?q=1"             ->', new URL('?q=1', base).href, '（只换查询串）');
console.log('"#top"             ->', new URL('#top', base).href, '（只换片段）');

// 绝对 URL 会直接覆盖 base，base 被忽略。
console.log('绝对 URL 覆盖 base ->', new URL('https://other.com/x', base).href);

// 实战：这就是浏览器里给 <a href> 补全绝对地址的原理，
// 也是爬虫、静态站点生成器里"解析页面内链接"的标准做法。

// 陷阱演示：只传相对路径不传 base，会抛 TypeError。
try {
  new URL('./setup.html');
} catch (err) {
  console.log('不传 base 解析相对路径报错：', err.constructor.name, '-', err.message);
}

// 更安全的探测方式是 URL.canParse（Node 18.17+ 提供），它返回布尔值而不抛异常。
console.log('URL.canParse("./a.html") =', URL.canParse('./a.html'), '（缺少 base）');
console.log('URL.canParse("./a.html", base) =', URL.canParse('./a.html', base));

// ---------------------------------------------------------------------------
// 4. 路径规范化：'..' 会被自动折叠
// ---------------------------------------------------------------------------

console.log('--- 4. 路径规范化 ---');

// WHATWG 标准要求解析时就把 '.' 和 '..' 折叠掉，
// 所以拿到的 pathname 永远是"已经规整过"的。
console.log(
  'new URL("https://x.com/a/b/../c/./d").pathname =',
  new URL('https://x.com/a/b/../c/./d').pathname,
);
// 注意：与 path.normalize 不同，连续斜杠**不会**被压缩——它们是有意义的多级空路径段。
console.log('重复斜杠会被保留 =', new URL('https://x.com/a//b///c').pathname);

// 这有一个重要的安全含义：用 URL 解析用户输入时，'..' 不能"偷偷"留在 pathname 里，
// 但在把 pathname 传给 fs 之前仍要再做一次校验（见 02_path_module.js 的目录穿越示例）。

// 默认端口的处理：https 的 443、http 的 80 会被自动省略。
console.log('https 默认端口被省略 =', new URL('https://x.com:443/a').host);
console.log('http 默认端口被省略  =', new URL('http://x.com:80/a').host);
console.log('非默认端口会保留    =', new URL('http://x.com:8080/a').host);

// ---------------------------------------------------------------------------
// 5. URLSearchParams —— 查询参数增删改查
// ---------------------------------------------------------------------------

console.log('--- 5. URLSearchParams 基本操作 ---');

// 三种构造方式：
const sp1 = new URLSearchParams('a=1&b=2&a=3'); // 从查询串
const sp2 = new URLSearchParams({ x: '10', y: '20' }); // 从普通对象
const sp3 = new URLSearchParams([['k1', 'v1'], ['k2', 'v2']]); // 从键值对数组
console.log('从字符串构造：', sp1.toString());
console.log('从对象构造：  ', sp2.toString());
console.log('从数组构造：  ', sp3.toString());

// get(key) 返回**第一个**匹配值；key 不存在返回 null。
console.log('sp1.get("a") =', sp1.get('a'), '（重复 key 只取第一个）');
console.log('sp1.get("zzz") =', sp1.get('zzz'), '（不存在返回 null）');

// getAll(key) 返回所有同名值组成的数组——处理多选框提交的参数就靠它。
console.log('sp1.getAll("a") =', sp1.getAll('a'));

// has(key) 判断存在性（不管值是什么）。
console.log('sp1.has("b") =', sp1.has('b'));
console.log('sp1.has("c") =', sp1.has('c'));

// set(key, value)：存在则**覆盖第一个**，并把其余同名项删掉。
sp1.set('a', '99');
console.log('set("a","99") 后：', sp1.toString(), '（原来的 a=3 被删了）');

// append(key, value)：追加，保留已有同名项。
sp1.append('a', '100');
console.log('append("a","100") 后：', sp1.toString());

// delete(key)：删掉**所有**同名项；第二个参数是可选的值过滤。
sp1.delete('a');
console.log('delete("a") 后：', sp1.toString());

// sort()：按键名字典序排序，稳定且保留同名项的相对顺序。
const unsorted = new URLSearchParams('z=1&a=2&m=3');
unsorted.sort();
console.log('sort() 后：', unsorted.toString());

// size 是参数个数（同名项分别计数）。
console.log('参数个数 size =', unsorted.size);

// ---------------------------------------------------------------------------
// 6. 遍历 URLSearchParams
// ---------------------------------------------------------------------------

console.log('--- 6. 遍历查询参数 ---');

const params = new URLSearchParams('name=张三&city=北京&tag=js&tag=node');

// 方式一：for...of 直接迭代，每一项是 [key, value] 数组。
for (const [key, value] of params) {
  console.log(`  for...of  -> ${key} = ${value}`);
}

// 方式二：entries() 显式拿迭代器（内容与直接迭代相同）。
console.log('  entries() ->', JSON.stringify([...params.entries()]));

// keys() / values() 只要键或只要值。
console.log('  keys()    ->', [...params.keys()].join(', '));
console.log('  values()  ->', [...params.values()].join(', '));

// 方式三：forEach，参数顺序是 (value, key, searchParams)——注意值是第一个，
// 这与 Array.prototype.forEach 的 (item, index) 习惯不同，容易看错。
params.forEach((value, key) => {
  console.log(`  forEach   -> ${key} = ${value}`);
});

// 直接用 Object.fromEntries 转成普通对象，但同名 key 会被最后一个覆盖。
console.log('  Object.fromEntries =', JSON.stringify(Object.fromEntries(params)));

// 实战：把查询参数安全地读出成带类型的配置。
function readPagination(search) {
  const p = new URLSearchParams(search);
  // 一定要给默认值 + 校验，因为外部输入不可信。
  // Number('abc') 是 NaN，用 Number.isFinite 兜底。
  const rawPage = Number(p.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const rawSize = Number(p.get('size') ?? '20');
  const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.min(Math.floor(rawSize), 100) : 20;
  return { page, size, skip: (page - 1) * size };
}
console.log('  readPagination("?page=3&size=15") =', JSON.stringify(readPagination('?page=3&size=15')));
console.log('  readPagination("?page=abc")       =', JSON.stringify(readPagination('?page=abc')));
console.log('  readPagination("?size=9999")      =', JSON.stringify(readPagination('?size=9999')), '（被 clamp 到 100）');

// ---------------------------------------------------------------------------
// 7. 编码与解码
// ---------------------------------------------------------------------------

console.log('--- 7. 编码与解码 ---');

// URLSearchParams 会自动编码：
//   中文等非 ASCII 字符 -> 百分号编码（UTF-8 字节序列），如 你 -> %E4%BD%A0
//   空格                -> 加号 '+'（这是 application/x-www-form-urlencoded 的规定，不是 %20）
//   '&' '=' 等分隔符    -> 百分号编码，因此不会被误当成分隔符
const encoded = new URLSearchParams({ q: '你好 世界', sym: 'a&b=c' });
console.log('自动编码结果：', encoded.toString());

// 解码是自动的：get 拿回来的就是原始字符串。
console.log('get("q") 解码后：', encoded.get('q'));
console.log('get("sym") 解码后：', encoded.get('sym'), '（& 和 = 没有被当成分隔符）');

// 陷阱：'+' 在表单编码（form-urlencoded）里表示空格，URLSearchParams 遵循这条规则。
const plus = new URLSearchParams('q=a+b');
console.log('原始串 "q=a+b" 解析后 get("q") =', JSON.stringify(plus.get('q')), '（+ 被解码成空格）');
console.log('再序列化回去 =', plus.toString(), '（空格又被编码回 +，所以这里往返是稳定的）');

// 但陷阱在于"含 + 的原始串"与"含 %20 的原始串"解析结果相同、序列化结果却统一成一种：
const spaceEncoded = new URLSearchParams('q=a%20b');
console.log('原始串 "q=a%20b" 解析后 get("q") =', JSON.stringify(spaceEncoded.get('q')));
console.log('再序列化回去 =', spaceEncoded.toString(), "（%20 变成了 +）");
console.log('两串原始文本不同，解析值相同，序列化后都变成 q=a+b。');
console.log('所以：比较参数请比较解析后的键值，不要比较原始字符串。');

// 单个片段的手动编解码：encodeURIComponent / decodeURIComponent。
// 它们不对 '/' ':' '?' 等做保留（与 encodeURI 的区别就在这里）。
const rawValue = 'a/b c?d=1';
console.log('原始值：          ', rawValue);
console.log('encodeURI         =', encodeURI(rawValue), '（保留 / ? = 等保留字符）');
console.log('encodeURIComponent =', encodeURIComponent(rawValue), '（几乎全编码，适合放进参数值）');
console.log('decodeURIComponent =', decodeURIComponent(encodeURIComponent(rawValue)), '（还原成功）');

// 解码非法序列会抛 URIError，所以要 try/catch。
try {
  decodeURIComponent('%E4%B8'); // 残缺的百分号序列
} catch (err) {
  console.log('解码残缺序列报错：', err.constructor.name, '-', err.message);
}

// ---------------------------------------------------------------------------
// 8. 构造 URL 的推荐做法
// ---------------------------------------------------------------------------

console.log('--- 8. 安全地构造 URL ---');

// 反面教材：用字符串拼接拼查询串。
// 只要参数值里出现 & 或 = 或中文，拼出来的 URL 就是错的甚至是有害的。
const userInput = 'js&admin=true';
const badUrl = 'https://api.example.com/search?q=' + userInput + '&page=1';
console.log('手工拼接：', badUrl);
console.log('  -> 解析出来的参数：', JSON.stringify([...new URL(badUrl).searchParams.entries()]));
console.log('  -> 用户输入里的 &= 被当成了新的参数，这是典型的参数注入！');

// 正确做法：用 URL 对象 + searchParams.append 构造，编码交给标准库。
const goodUrl = new URL('https://api.example.com/search');
goodUrl.searchParams.append('q', userInput);
goodUrl.searchParams.append('page', '1');
console.log('URL + searchParams：', goodUrl.href);
console.log('  -> 解析出来的参数：', JSON.stringify([...goodUrl.searchParams.entries()]));
console.log('  -> 用户输入被完整地当作一个值，注入被阻止了。');

// 另一个常见需求：在已有 URL 上"增量修改"参数而不碰其他部分。
function buildPageUrl(baseUrl, { page, size, sort }) {
  const url = new URL(baseUrl);
  if (page != null) url.searchParams.set('page', String(page));
  if (size != null) url.searchParams.set('size', String(size));
  if (sort) url.searchParams.set('sort', sort);
  return url.href;
}
console.log(
  'buildPageUrl(...) =',
  buildPageUrl('https://shop.example.com/items?keyword=键盘', { page: 2, size: 30, sort: 'price_asc' }),
);
console.log(
  'buildPageUrl(...) 只改 page =',
  buildPageUrl('https://shop.example.com/items?keyword=键盘&page=1', { page: 5 }),
);

console.log('--- 全部演示结束 ---');
