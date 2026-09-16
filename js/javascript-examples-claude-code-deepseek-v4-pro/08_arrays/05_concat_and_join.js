/**
 * ============================================================================
 * 知识点：concat 合并、join 转字符串、split 的配合
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/03_slice.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - concat(...values)：把多个数组（或值）拼接成一个**新数组**并返回，原数组不变。
 *    - join(separator)：把数组的所有元素用分隔符连接成一个**字符串**，原数组不变。
 *    - String.prototype.split(sep)：join 的逆操作，把字符串按分隔符切成**数组**。
 *
 *    三者的关系是"数组 <-> 字符串"的互转：
 *        数组 --join--> 字符串 --split--> 数组
 *        'a,b,c'.split(',')  ->  ['a','b','c']
 *        ['a','b','c'].join('-')  ->  'a-b-c'
 *
 * 2. 为什么需要它们
 *    - 前端要渲染"标签列表"时，需要把 ['红','绿'] join 成 '红, 绿'；
 *    - 从 CSV/日志文件读进来的一行文本，需要 split 成字段数组才能处理；
 *    - 合并多个数据源（本页数据 + 下一页数据），用 concat 或展开运算符；
 *    - 生成 URL 查询串、路径、类名（className）等，join 是最简洁的工具。
 *
 * 3. 核心语法要点
 *    (1) concat 的特点：**会"摊平一层"**。
 *        [1].concat([2, 3])   -> [1, 2, 3]      （数组参数被摊开一层）
 *        [1].concat(2, 3)     -> [1, 2, 3]      （普通值被直接追加）
 *        [1].concat([[2, 3]]) -> [1, [2, 3]]    （只摊平一层，嵌套数组还在）
 *    (2) join 的参数：
 *        - 省略或传 undefined 时，默认用逗号 ',' 连接；
 *        - 传空字符串 '' 可以无缝拼接；
 *        - 元素为 null / undefined 时，会被转成**空字符串**（这点和 String() 不同）；
 *        - 元素是对象时，会调用它的 toString()，得到 '[object Object]'。
 *    (3) split 的参数：
 *        - split('') 按"码元"切分（对表情符号等代理对字符不安全，建议用 [...str]）；
 *        - split(',') 按字符切；
 *        - split(/,/) 可以传正则，支持多分隔符；
 *        - split(',', 2) 第二个参数限制返回的最大片段数；
 *        - 字符串不含分隔符时返回单元素数组 [原字符串]；空字符串返回 []。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】concat 与 join **都不修改原数组**（non-mutating），
 *      split 是字符串的方法，更谈不上修改数组。这一点和 push/splice 相反。
 *    - concat 接收数组参数时会"摊平一层"，这不是递归摊平；要任意深度摊平请用 flat()（见 11 号文件）。
 *    - concat 会把"类数组对象"也当作数组摊平，但普通对象（没有 length）会被当成一个值。
 *    - join 对 null/undefined 元素输出空串，容易造成"数据看起来少了一截"的错觉。
 *    - join 不传参数时用逗号，这和"用 + 拼字符串"的直觉不同。
 *    - 循环里用 `str += arr[i] + ','` 拼字符串在超大数组上很慢；join 是原生实现，快得多。
 *    - split 与 join 参数不对称的坑：''.split(',') 得到 ['']（长度为 1），不是 []。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/05_concat_and_join.js
 *
 * 【预期输出】
 *   依次演示 concat 的各种合并场景与"只摊平一层"的行为、join 的分隔符与空值处理、
 *   split 的切分规则，最后给出 CSV 解析与 URL 查询串构造两个实战例子。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. concat 基础：合并数组
// ---------------------------------------------------------------------------

console.log('--- 1. concat 基础 ---');

const a = [1, 2];
const b = [3, 4];
const c = [5];

console.log('a =', JSON.stringify(a), '，b =', JSON.stringify(b), '，c =', JSON.stringify(c));

// 一次合并多个
const merged = a.concat(b, c);
console.log('a.concat(b, c) =', JSON.stringify(merged));
console.log('原数组 a 依然是 =', JSON.stringify(a), '（concat 不修改原数组）');

// 也可以追加普通值
const withValues = a.concat(3, 4, 5);
console.log('a.concat(3, 4, 5) =', JSON.stringify(withValues));

// 值可以与数组混合
const mixedConcat = a.concat(99, b, 'x');
console.log('a.concat(99, b, "x") =', JSON.stringify(mixedConcat));

// 不传参数：得到原数组的浅拷贝
const copy = a.concat();
console.log('a.concat() =', JSON.stringify(copy), '，是否同一引用 =', copy === a);

// 现代写法对比：展开运算符
const bySpread = [...a, ...b, ...c];
console.log('[...a, ...b, ...c] =', JSON.stringify(bySpread), '（结果相同）');
console.log('两者的差别：concat 可以把"类数组"摊平，展开运算符则依赖"可迭代"协议。');

// ---------------------------------------------------------------------------
// 2. concat 的"只摊平一层"行为
// ---------------------------------------------------------------------------

console.log('\n--- 2. concat 只摊平一层 ---');

console.log('[1].concat([2, 3])     =', JSON.stringify([1].concat([2, 3])), '（数组被摊开）');
console.log('[1].concat([[2, 3]])   =', JSON.stringify([1].concat([[2, 3]])), '（嵌套数组保留）');
console.log('[1].concat([[[2, 3]]]) =', JSON.stringify([1].concat([[[2, 3]]])), '（更深的嵌套当然也保留）');

// 要任意深度摊平用 flat()，见 11 号文件
console.log('[1].concat([[2, 3]]).flat(2) =', JSON.stringify([1].concat([[2, 3]]).flat(2)));

// concat 会把"类数组对象"（有 length 的对象）也摊平
const arrayLike = { 0: 'p', 1: 'q', length: 2 };
console.log("['start'].concat(arrayLike) =", JSON.stringify(['start'].concat(arrayLike)));

// 但普通对象（没有 length）会被当成"一个值"
const plainObj = { name: '对象' };
console.log("['start'].concat(plainObj) =", JSON.stringify(['start'].concat(plainObj)));
console.log('（对象被整体塞进去，因为它没有 length 属性）');

// 字符串是可迭代且"类数组"的，会被摊平成一堆字符
console.log("['x'].concat('abc') =", JSON.stringify(['x'].concat('abc')));

// ---------------------------------------------------------------------------
// 3. join 基础：数组转字符串
// ---------------------------------------------------------------------------

console.log('\n--- 3. join 基础 ---');

const words = ['JavaScript', '是', '一门', '语言'];
console.log('原数组 =', JSON.stringify(words));

console.log("words.join(' ')  =", JSON.stringify(words.join(' ')), '（空格连接）');
console.log("words.join('')   =", JSON.stringify(words.join('')), '（无缝拼接）');
console.log("words.join('-')  =", JSON.stringify(words.join('-')), '（连字符连接）');
console.log('words.join()     =', JSON.stringify(words.join()), '（不传参数默认逗号）');
console.log("words.join(', ') =", JSON.stringify(words.join(', ')), '（常用：逗号加空格）');
console.log('原数组依然是 =', JSON.stringify(words), '（join 不修改原数组）');

// 数字数组
const nums = [1, 2, 3];
console.log('\n[1,2,3].join(" + ") =', JSON.stringify(nums.join(' + ')));
console.log('拼接成公式后再求值（仅演示）：', nums.join(' + '), '=', eval(nums.join(' + ')));

// 空数组与单元素数组
console.log('空数组 join =', JSON.stringify([].join('-')), '（空字符串）');
console.log('单元素 join =', JSON.stringify(['only'].join('-')), '（不加分隔符）');

// ---------------------------------------------------------------------------
// 4. join 对特殊值的处理
// ---------------------------------------------------------------------------

console.log('\n--- 4. join 的特殊值处理 ---');

// null 和 undefined 会被转成空字符串（而不是 "null" / "undefined"）
console.log("['a', null, 'b', undefined, 'c'].join('-') =",
  JSON.stringify(['a', null, 'b', undefined, 'c'].join('-')));

// 稀疏数组的空洞同样按空字符串处理
const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
console.log('稀疏数组 [1, , 3].join("-") =', JSON.stringify(sparse.join('-')));

// 对象会被调用 toString()，默认得到 [object Object]（几乎总是 bug 信号）
console.log('[{a:1}].join() =', JSON.stringify([{ a: 1 }].join()));

// 要正确输出对象数组，应先 map 成字符串
const users = [
  { name: '张三', age: 20 },
  { name: '李四', age: 30 },
];
console.log('对象数组直接 join =', JSON.stringify(users.join(' | ')));
console.log('先 map 再 join   =', JSON.stringify(users.map((u) => `${u.name}(${u.age})`).join(' | ')));

// 嵌套数组：join 会递归地把内层数组也 join 掉（用逗号）
console.log('[[1,2],[3,4]].join("-") =', JSON.stringify([[1, 2], [3, 4]].join('-')));

// ---------------------------------------------------------------------------
// 5. split 基础：字符串转数组
// ---------------------------------------------------------------------------

console.log('\n--- 5. split 基础 ---');

const csv = '张三,李四,王五';
console.log('原字符串 =', JSON.stringify(csv));
console.log("split(',') =", JSON.stringify(csv.split(',')));
console.log('原字符串没变 =', JSON.stringify(csv));

const path = '/usr/local/bin/node';
console.log("\n'/usr/local/bin/node'.split('/') =", JSON.stringify(path.split('/')));
console.log('（注意第一个元素是空字符串，因为开头就是分隔符）');

// 空字符串切分：返回空数组
console.log("''.split(',') =", JSON.stringify(''.split(',')), '（空数组）');
console.log("'abc'.split(',') =", JSON.stringify('abc'.split(',')), '（无分隔符 -> 单元素数组）');

// 用空字符串切分 = 拆成单字符数组
console.log("\n'hello'.split('') =", JSON.stringify('hello'.split('')));
console.log("更安全的写法 [...'hello'] =", JSON.stringify([...'hello']), '（能正确处理 emoji 等）');
console.log("'a😀b'.split('') 长度 =", 'a😀b'.split('').length, '，[...\'a😀b\'] 长度 =', [...'a😀b'].length);

// 第二个参数：限制返回片段数
console.log("\n'a-b-c-d'.split('-', 2) =", JSON.stringify('a-b-c-d'.split('-', 2)));
console.log("'a-b-c-d'.split('-', 0) =", JSON.stringify('a-b-c-d'.split('-', 0)));

// 用正则切分：支持多个分隔符
console.log("\n'a,b; c|d'.split(/[,;|]/) =", JSON.stringify('a,b; c|d'.split(/[,;|]/)));
console.log("按空白切分（连续空白算一个）'  a   b  c '.trim().split(/\\s+/) =",
  JSON.stringify('  a   b  c '.trim().split(/\s+/)));

// ---------------------------------------------------------------------------
// 6. join 与 split 往返：小心不对称
// ---------------------------------------------------------------------------

console.log('\n--- 6. join / split 往返 ---');

const roundTrip = ['a', 'b', 'c'];
const str = roundTrip.join('-');
const back = str.split('-');
console.log('原数组 =', JSON.stringify(roundTrip));
console.log('join 后 =', JSON.stringify(str));
console.log('split 回来 =', JSON.stringify(back));
console.log('内容相等 =', JSON.stringify(roundTrip) === JSON.stringify(back));

// 但要小心：如果元素本身含分隔符，往返就是不可逆的
const tricky = ['a-b', 'c'];
const trickyStr = tricky.join('-'); // 'a-b-c'
const trickyBack = trickyStr.split('-'); // ['a','b','c'] 多出来一个
console.log('\n元素本身含分隔符时：');
console.log('原数组 =', JSON.stringify(tricky));
console.log('join 后 =', JSON.stringify(trickyStr));
console.log('split 回来 =', JSON.stringify(trickyBack), '（结构被破坏，不可逆）');
console.log('结论：用 join/split 做序列化不可靠，复杂结构请用 JSON.stringify / JSON.parse。');

const jsonRound = JSON.parse(JSON.stringify(tricky));
console.log('JSON 往返 =', JSON.stringify(jsonRound), '（可靠）');

// ---------------------------------------------------------------------------
// 7. 实战一：解析 CSV 文本
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：解析 CSV ---');

const csvText = [
  'name,age,city',
  '张三,20,北京',
  '李四,31,上海',
  '王五,25,广州',
].join('\n');

console.log('原始 CSV 文本：');
console.log(csvText);

const lines = csvText.split('\n');
const header = lines[0].split(',');
const rows = lines.slice(1).map((line) => {
  const cells = line.split(',');
  // 把表头与单元格配对成对象
  return Object.fromEntries(header.map((key, i) => [key, cells[i]]));
});
console.log('\n解析结果 =', JSON.stringify(rows, null, 0));

// 再反向生成 CSV（join 回去）
const regenerated = [header.join(','), ...rows.map((r) => header.map((k) => r[k]).join(','))].join('\n');
console.log('重新生成 =', JSON.stringify(regenerated));
console.log('往返一致 =', regenerated === csvText);

// ---------------------------------------------------------------------------
// 8. 实战二：构造 URL 查询串
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：URL 查询串 ---');

const params = {
  keyword: 'javascript 数组',
  page: 2,
  pageSize: 20,
  tags: ['es6', 'array'],
};

// 用 entries + map + join 构造（需要 encodeURIComponent 处理特殊字符）
const query = Object.entries(params)
  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v.join(',') : v)}`)
  .join('&');

console.log('查询串 =', query);
console.log('完整 URL =', `https://example.com/search?${query}`);

// 用 URLSearchParams 更省事（会自动编码，也会自动把数组 join 成逗号）
const usp = new URLSearchParams(params);
console.log('URLSearchParams 版本 =', usp.toString());

// ---------------------------------------------------------------------------
// 9. 实战三：生成 HTML 列表（也是 join 最经典的用途）
// ---------------------------------------------------------------------------

console.log('\n--- 9. 实战：生成 HTML 片段 ---');

const items = ['首页', '文档', '关于'];
const html = `<ul>\n${items.map((t) => `  <li>${t}</li>`).join('\n')}\n</ul>`;
console.log(html);

console.log('\n小结：concat 合并（不改原数组，只摊平一层）；join 数组 -> 字符串（不改原数组）；');
console.log('      split 字符串 -> 数组。三者配合可以完成绝大多数"文本 <-> 列表"的转换。');
