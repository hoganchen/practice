/**
 * ============================================================================
 * 知识点：split 与 join —— 字符串与数组的互转
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】入门
 * 【前置知识】11_strings/05_transform_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - String.prototype.split(separator, limit)：把字符串按分隔符切成数组。
 *    - Array.prototype.join(separator)：把数组元素用分隔符拼成一个字符串。
 *    两者是一对互逆操作：'a,b'.split(',') → ['a','b'] → join(',') → 'a,b'。
 *
 * 2. 为什么需要
 *    字符串处理里大量任务本质是"切开 → 逐段处理 → 拼回去"：
 *      - 解析 CSV / 路径 / 命令行参数 / URL 查询串
 *      - 按行拆分文本、统计词频
 *      - 把数组渲染成展示文本（列表、SQL IN 子句、URL 参数）
 *      - 反转字符串、逐字符处理（split('') / [...str]）
 *
 * 3. 核心语法要点
 *    - split 的 separator 可以是：
 *        • 字符串：按字面量切分，不会当成正则
 *        • 正则：按模式切分，可实现"按任意空白切分"
 *        • undefined：返回 [整个字符串]
 *        • ''（空串）：返回每个字符（UTF-16 码元）组成的数组
 *    - limit 限制返回数组的最大长度，超出的部分被丢弃。
 *    - 分隔符出现在开头/结尾时会产生空字符串元素（如 'a,'.split(',') → ['a','']）。
 *    - join 默认用逗号；join('') 是"无分隔拼接"，是最常用的写法。
 *    - 用 join 做字符串累加比循环里 += 更高效（避免反复创建中间字符串）。
 *
 * 4. 常见陷阱
 *    - split('') 会把 emoji 拆成两个乱码码元，应按码点拆分用 [...str]（见 09 号文件）。
 *    - 用正则切分时，若正则含捕获组，捕获到的内容也会进入结果数组。
 *    - 'a,b,'.split(',') 得到 ['a','b','']，长度是 3 不是 2，处理 CSV 时要过滤空段。
 *    - join 会把 null / undefined 变成空字符串，但会把对象变成 [object Object]。
 *    - split 后再 join('') 的常见用途是"删除所有某字符"，但要注意大小写敏感。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/06_split_and_join.js
 *
 * 【预期输出】
 *   演示 split 各种分隔符/limit 的行为，以及 split 与 join 配合的实战用法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. split 基础：字符串分隔符
// ---------------------------------------------------------------------------

console.log('--- 1. 基础切分 ---');

const csv = 'apple,banana,cherry';
console.log('原串：', JSON.stringify(csv));
// 用逗号切分，得到三项组成的数组
console.log("split(',')：", JSON.stringify(csv.split(',')));
console.log('结果长度：', csv.split(',').length);

// 用 JSON.stringify 看数组内容最清楚
const path = '/usr/local/bin/node';
console.log('路径：', JSON.stringify(path));
console.log("split('/')：", JSON.stringify(path.split('/'))); // 注意首尾的空串
console.log("按 '/' 切分后长度：", path.split('/').length); // 5，含开头的空串

// 多字符分隔符按字面量整体匹配
const pair = 'a::b::c';
console.log("split('::')：", JSON.stringify(pair.split('::')));
// 而 ':' 会切成更多段
console.log("split(':')：", JSON.stringify(pair.split(':'))); // 出现空串

// ---------------------------------------------------------------------------
// 2. 特殊分隔符：undefined 与空串
// ---------------------------------------------------------------------------

console.log('--- 2. 特殊分隔符 ---');

// 不传参数（或传 undefined）→ 整个字符串作为唯一元素
console.log('split()：', JSON.stringify(csv.split()));
console.log('split(undefined)：', JSON.stringify(csv.split(undefined)));

// 传空串 → 按 UTF-16 码元逐个拆开
console.log("split('')：", JSON.stringify(csv.split('')));
console.log("'abc'.split('')：", JSON.stringify('abc'.split('')));
// 也可以用展开运算符，效果相同
console.log("[...'abc']：", JSON.stringify([...'abc']));

// 分隔符在字符串中不存在 → 返回单元素数组
console.log("split('|')：", JSON.stringify(csv.split('|'))); // ['apple,banana,cherry']

// ---------------------------------------------------------------------------
// 3. limit 参数
// ---------------------------------------------------------------------------

console.log('--- 3. limit 限制长度 ---');

const nums = '1-2-3-4-5';
console.log('原串：', JSON.stringify(nums));
// 第二个参数限制最多返回几段，剩下的部分被整体丢弃
console.log('split("-", 3)：', JSON.stringify(nums.split('-', 3))); // ['1','2','3']
console.log('split("-", 1)：', JSON.stringify(nums.split('-', 1))); // ['1']
console.log('split("-", 0)：', JSON.stringify(nums.split('-', 0))); // []
console.log('split("-", 100)：', JSON.stringify(nums.split('-', 100))); // 全部分段

// 实战：只需要取前两段时，limit 更省内存（不用先切出全部再 slice）
const version = '1.2.3-beta.4';
const [major, minor] = version.split('.', 2);
console.log('主版本：', major, '| 次版本：', minor);

// ---------------------------------------------------------------------------
// 4. 用正则切分
// ---------------------------------------------------------------------------

console.log('--- 4. 正则切分 ---');

const sentence = 'the  quick brown\tfox\njumps';
console.log('原串：', JSON.stringify(sentence));
// \s+ 匹配一个或多个空白字符（空格、制表符、换行都算）
console.log('按 /\\s+/ 切分：', JSON.stringify(sentence.split(/\s+/)));
// 对比：只按单个空格切分，连续空格会产生空串
console.log("按 ' ' 切分：", JSON.stringify(sentence.split(' ')));

// 正则捕获组会进入结果数组（注意这个特性！）
const withGroups = 'a1b2c3';
console.log("split(/(\\d)/)：", JSON.stringify(withGroups.split(/(\d)/)));
// 结果里数字也被保留了，因为它们是捕获组匹配到的内容

// 用非捕获组 (?:...) 可以避免这个问题
console.log("split(/(?:\\d)/)：", JSON.stringify(withGroups.split(/(?:\d)/)));

// 实战：同时按多种分隔符切分
const mixed = 'a,b;c d|e';
console.log('原串：', JSON.stringify(mixed));
console.log("按 /[,; |]/ 切分：", JSON.stringify(mixed.split(/[,; |]/)));

// ---------------------------------------------------------------------------
// 5. join —— 数组拼回字符串
// ---------------------------------------------------------------------------

console.log('--- 5. join ---');

const arr = ['apple', 'banana', 'cherry'];
// 不传参数默认用逗号
console.log('join()：', JSON.stringify(arr.join()));
console.log("join('')：", JSON.stringify(arr.join('')));
console.log("join(' | ')：", JSON.stringify(arr.join(' | ')));
console.log("join('\\n')：", JSON.stringify(arr.join('\n')));

// join 会把非字符串元素转成字符串
const mixedArr = [1, true, null, undefined, { a: 1 }, [2, 3]];
console.log('混合数组：', JSON.stringify(mixedArr.map((x) => String(x))));
console.log("join('-'):", JSON.stringify(mixedArr.join('-')));
// null / undefined 会变成空字符串，对象变成 [object Object]

// 空数组 join 得到空字符串
console.log('[].join(",")：', JSON.stringify([].join(',')));

// 单元素数组 join 不加分隔符
console.log("['only'].join(','):", JSON.stringify(['only'].join(',')));

// ---------------------------------------------------------------------------
// 6. split + 数组方法 + join —— 最常用的组合拳
// ---------------------------------------------------------------------------

console.log('--- 6. 组合拳 ---');

// 6.1 反转字符串
const word = 'JavaScript';
console.log('反转：', JSON.stringify(word.split('').reverse().join('')));

// 6.2 删除所有空格
const spaced = 'a b c   d';
console.log('删除空格：', JSON.stringify(spaced.split(' ').join('')));
// 用正则一步到位更简洁
console.log('正则替换：', JSON.stringify(spaced.replace(/\s/g, '')));

// 6.3 单词首字母大写（title case）
const title = 'hello beautiful world';
const titled = title
  .split(' ') // 切成词
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1)) // 每个词首字母大写
  .join(' '); // 拼回去
console.log('title case：', JSON.stringify(titled));

// 6.4 值列表去重并排序
const dup = 'b,a,c,a,b';
const unique = [...new Set(dup.split(','))].sort();
console.log('去重排序：', JSON.stringify(unique));
console.log('拼回字符串：', JSON.stringify(unique.join(',')));

// 6.5 生成 SQL IN 子句（演示用途，实际项目必须用参数化查询）
const ids = [1, 2, 3];
const inClause = `id IN (${ids.join(', ')})`;
console.log('IN 子句：', JSON.stringify(inClause));

// 6.6 解析查询字符串
const query = 'page=2&size=10&sort=name';
const params = Object.fromEntries(
  query.split('&').map((pair) => {
    const [k, v] = pair.split('=');
    return [k, v];
  }),
);
console.log('查询参数：', JSON.stringify(params));

// ---------------------------------------------------------------------------
// 7. 陷阱：空段与 emoji
// ---------------------------------------------------------------------------

console.log('--- 7. 常见陷阱 ---');

// 7.1 首尾分隔符会产生空字符串元素
const trailing = 'a,b,';
console.log("'a,b,'.split(',')：", JSON.stringify(trailing.split(','))); // ['a','b','']
console.log('长度是：', trailing.split(',').length); // 3

// 处理 CSV 时的标准做法：过滤掉空段
const cleaned = trailing.split(',').filter((s) => s !== '');
console.log('过滤空段后：', JSON.stringify(cleaned));

// 7.2 split('') 会拆坏 emoji
const emojiStr = 'a😀b';
console.log("'a😀b'.split('')：", JSON.stringify(emojiStr.split(''))); // 4 段，😀 被拆散
console.log('长度：', emojiStr.split('').length); // 4
// 正确做法：用展开运算符按码点拆分
console.log("[...'a😀b']：", JSON.stringify([...emojiStr])); // 3 段，😀 完整
console.log('长度：', [...emojiStr].length); // 3

// 7.3 用 join 拼 emoji 不受影响，因为元素原样保留
console.log('join 回去：', JSON.stringify([...emojiStr].join('')));

console.log('\n全部演示完毕。');
