/**
 * ============================================================================
 * 知识点：字符串查找 —— indexOf / lastIndexOf / includes / startsWith / endsWith / search
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】入门
 * 【前置知识】11_strings/03_indexing_and_length.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这一组方法用于"在字符串里找东西"，按返回值和用途可以分为两类：
 *      返回位置（数字）       返回布尔（true/false）
 *      indexOf                includes
 *      lastIndexOf            startsWith
 *      search                 endsWith
 *    位置类方法找不到时返回 -1；布尔类方法找不到返回 false。
 *
 * 2. 为什么需要
 *    - 校验输入格式：email.endsWith('@example.com')、url.startsWith('https://')
 *    - 判断是否包含关键字：log.includes('ERROR')
 *    - 定位并截取：indexOf 找到冒号位置，再用 slice 取后半段
 *    - search 支持正则，可以一次定位"符合某个模式"的位置
 *
 * 3. 核心语法要点
 *    - indexOf(子串, fromIndex)：从 fromIndex 开始向后找，返回首次出现的下标。
 *    - lastIndexOf(子串, fromIndex)：从 fromIndex 开始向前找，返回最后一次出现的下标。
 *    - includes(子串, fromIndex)：内部约等于 indexOf(...) !== -1，但语义更直白。
 *    - startsWith(子串, 起始位置) / endsWith(子串, 结束位置)：
 *      endsWith 的第二个参数表示"把字符串看作只到该长度为止"。
 *    - search(正则)：只接受正则（或会被转成正则的字符串），返回首次匹配的下标，
 *      不支持 fromIndex 参数，也拿不到全局状态（不像 RegExp.prototype.exec）。
 *    - 所有"字符串参数"版本都是大小写敏感的；要不敏感需先 toLowerCase，
 *      或使用正则的 i 标志（如 search(/abc/i)）。
 *
 * 4. 常见陷阱
 *    - 用 if (str.indexOf(x)) 做判断：indexOf 返回 0 时是假值，会误判为"没找到"。
 *      正确写法是 !== -1，或者直接用 includes。
 *    - endsWith 的第二个参数不是"起始位置"，含义和 startsWith 的不对称。
 *    - search 传字符串时会先被 new RegExp 包装，里面的 . * 等字符有特殊含义。
 *    - 这些方法都区分大小写，"Hello" 里找 "hello" 会失败。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/04_search_methods.js
 *
 * 【预期输出】
 *   演示各查找方法在命中/未命中/边界参数下的返回值与用法对比。
 * ============================================================================
 */

console.log('--- 1. indexOf / lastIndexOf ---');

const text = 'the quick brown fox jumps over the lazy dog';

// indexOf 返回首次出现的下标（从 0 开始数）
console.log('text：', JSON.stringify(text));
console.log("indexOf('the')：", text.indexOf('the')); // 0
console.log("indexOf('o')：", text.indexOf('o')); // 12，第一个 o

// 找不到返回 -1
console.log("indexOf('cat')：", text.indexOf('cat')); // -1

// 第二个参数 fromIndex：从这个位置开始往后找
console.log("indexOf('the', 1)：", text.indexOf('the', 1)); // 31，跳过开头的 the
console.log("indexOf('the', 32)：", text.indexOf('the', 32)); // -1，后面没有了

// lastIndexOf 从后往前找，返回最后一次出现的下标
console.log("lastIndexOf('the')：", text.lastIndexOf('the')); // 31
console.log("lastIndexOf('o')：", text.lastIndexOf('o')); // 41，最后一个 o

// lastIndexOf 的 fromIndex 是"从该位置向前搜索"，与 indexOf 方向相反
console.log("lastIndexOf('o', 30)：", text.lastIndexOf('o', 30)); // 26，即 'brown' 里的 o（41 之后的都排除了）
console.log("indexOf 与 lastIndexOf 相同位置：", text.indexOf('brown') === text.lastIndexOf('brown')); // true，只出现一次

// ---------------------------------------------------------------------------
// 2. 位置类方法的类型转换
// ---------------------------------------------------------------------------

console.log('--- 2. 参数会被转成字符串 ---');

const nums = '1234567890';
// 传数字时会先被转成字符串再查找
console.log("'1234567890'.indexOf(3)：", nums.indexOf(3)); // 2
console.log("'1234567890'.indexOf('3')：", nums.indexOf('3')); // 2，结果一样
// 空字符串总是返回 0（任何字符串都"以空串开头"）
console.log("indexOf('')：", nums.indexOf('')); // 0
console.log("lastIndexOf('')：", nums.lastIndexOf('')); // 10，等于 length

// ---------------------------------------------------------------------------
// 3. includes —— 语义最清晰的包含判断
// ---------------------------------------------------------------------------

console.log('--- 3. includes ---');

console.log("includes('quick')：", text.includes('quick')); // true
console.log("includes('Quick')：", text.includes('Quick')); // false，区分大小写
console.log("includes('quick', 5)：", text.includes('quick', 5)); // false，从下标 5 开始找不到

// 与 indexOf 的等价关系
console.log('includes(x) === (indexOf(x) !== -1)：', text.includes('fox') === (text.indexOf('fox') !== -1));

// 典型实战：日志级别判断
const logs = ['[INFO] 服务启动', '[ERROR] 数据库连接失败', '[WARN] 磁盘空间不足'];
for (const line of logs) {
  // 用 includes 写出来一眼就能读懂
  if (line.includes('ERROR')) {
    console.log('发现错误日志：', JSON.stringify(line));
  }
}

// ---------------------------------------------------------------------------
// 4. startsWith / endsWith
// ---------------------------------------------------------------------------

console.log('--- 4. startsWith / endsWith ---');

const url = 'https://example.com/docs/index.html';
console.log('url：', JSON.stringify(url));
console.log("startsWith('https://')：", url.startsWith('https://')); // true
console.log("startsWith('http://')：", url.startsWith('http://')); // false
console.log("endsWith('.html')：", url.endsWith('.html')); // true
console.log("endsWith('.htm')：", url.endsWith('.htm')); // false

// startsWith 的第二个参数：从这个下标开始"看作字符串开头"
console.log("startsWith('example', 8)：", url.startsWith('example', 8)); // true（'example.com/...'）

// endsWith 的第二个参数：只考虑前 N 个字符（含义与 startsWith 不对称！）
console.log("endsWith('example.com', 19)：", url.endsWith('example.com', 19)); // true
console.log("url.slice(0, 19)：", JSON.stringify(url.slice(0, 19))); // 'https://example.com'

// 实战：文件类型过滤 + 前缀校验
const files = ['report.pdf', 'notes.md', 'archive.tar.gz', 'image.PNG'];
const markdownFiles = files.filter((f) => f.endsWith('.md'));
console.log('markdown 文件：', JSON.stringify(markdownFiles));

// 大小写不敏感的正确做法：先统一大小写
const pngFiles = files.filter((f) => f.toLowerCase().endsWith('.png'));
console.log('png 文件（忽略大小写）：', JSON.stringify(pngFiles));

// ---------------------------------------------------------------------------
// 5. search —— 用正则定位
// ---------------------------------------------------------------------------

console.log('--- 5. search ---');

// search 接受正则表达式，返回首次匹配的下标，找不到返回 -1
console.log('search(/quick/)：', text.search(/quick/)); // 4
console.log('search(/cat/)：', text.search(/cat/)); // -1

// 正则的能力：忽略大小写、字符类、量词
console.log('search(/QUICK/i)：', text.search(/QUICK/i)); // 4，i 标志忽略大小写
console.log('search(/\\d+/)（找数字）：', text.search(/\d+/)); // -1，这段文本没有数字
console.log("'订单 A1234'.search(/\\d+/)：", '订单 A1234'.search(/\d+/)); // 4，找到数字起始位置

// search 传字符串时会被隐式转成正则，里面的特殊字符会生效
console.log("search('a.c') 当成正则：", 'abc'.search('a.c')); // 0，. 匹配任意字符
console.log("indexOf('a.c') 当成字面量：", 'abc'.indexOf('a.c')); // -1，字面量没找到
// 这解释了 search 与 indexOf 在处理特殊字符时的关键差别

// 注意：search 忽略正则的 g 标志，永远只返回第一个匹配的位置
console.log('search(/o/g) 仍只返回第一个：', text.search(/o/g)); // 12

// ---------------------------------------------------------------------------
// 6. 实战：定位并截取子串
// ---------------------------------------------------------------------------

console.log('--- 6. 实战：定位并截取 ---');

const header = 'Content-Type: application/json; charset=utf-8';
// 用 indexOf 找到分隔符的准确位置，再用 slice 切出需要的部分
const colonIndex = header.indexOf(':');
const semiIndex = header.indexOf(';');
const mime = header.slice(colonIndex + 1, semiIndex).trim();
console.log('冒号位置：', colonIndex, '| 分号位置：', semiIndex);
console.log('解析出的 MIME：', JSON.stringify(mime));

// 用 includes 做前置判断，避免在找不到时切出错误结果
const line2 = 'no-colon-here';
if (line2.includes(':')) {
  console.log('可以切分');
} else {
  console.log('没有冒号，跳过切分（避免 slice(-1) 的坑）');
}

// ---------------------------------------------------------------------------
// 7. 常见陷阱：用 indexOf 直接做 if 判断
// ---------------------------------------------------------------------------

console.log('--- 7. if (indexOf) 陷阱 ---');

const haystack = 'apple pie';
const needle = 'apple';
console.log('needle 在下标：', haystack.indexOf(needle)); // 0

// 错误写法：0 是假值，会被误判成"没找到"
if (haystack.indexOf(needle)) {
  console.log('错误写法：报告"没找到"（实际找到了）');
} else {
  console.log('错误写法：走了 else 分支 ← 这就是 bug');
}

// 正确写法一：与 -1 比较
if (haystack.indexOf(needle) !== -1) {
  console.log('正确写法（!== -1）：找到了');
}
// 正确写法二：用 includes
if (haystack.includes(needle)) {
  console.log('正确写法（includes）：找到了');
}

console.log('\n全部演示完毕。');
