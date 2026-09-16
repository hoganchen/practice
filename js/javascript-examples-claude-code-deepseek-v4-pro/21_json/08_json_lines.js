/**
 * ============================================================================
 * 知识点：JSON Lines（NDJSON）格式 —— 逐行解析大文件
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】进阶
 * 【前置知识】21_json/02_json_format_rules.js、21_json/07_read_write_json_file.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON Lines（俗称 NDJSON，Newline Delimited JSON）是一种"一行一个 JSON 值"的
 *    文本格式，约定是：
 *      · 每一行必须是一个完整、合法的 JSON 值（通常是对象）
 *      · 行与行之间用 \n 分隔
 *      · 文件末尾可以有一个换行，也可以没有
 *      · 不允许"跨行的 JSON"，也不允许行内出现未转义的换行
 *      · 建议使用 UTF-8 编码，且不要写 BOM
 *    文件扩展名惯例是 .jsonl 或 .ndjson。
 *
 * 2. 为什么需要
 *    普通的 JSON 文件是一个巨大的数组：'[{"a":1},{"a":2},...]'。它有两个硬伤：
 *      · 必须整体解析：想读第 100 万条，也得先把整段文本读进内存并解析完。
 *      · 必须整体生成：想追加一条，就得把整份文件重写一遍。
 *    JSON Lines 正好解决这两点：
 *      · 可以逐行流式处理，内存占用与"单行大小"有关，而与总行数无关。
 *      · 追加一条记录就是"往文件末尾再写一行 + 换行"。
 *    所以它成了日志、数据导出、大数据流水线的常用格式（比如很多云厂商的
 *    "导出到对象存储"功能默认就是 NDJSON）。
 *
 * 3. 核心语法要点
 *    ---- 写 ----
 *    对每条记录执行 JSON.stringify(record)（注意：不要传缩进，缩进会产生换行！），
 *    然后拼上 '\n'。
 *    ---- 读 ----
 *    按 '\n' 切分，逐行 JSON.parse。
 *    真实文件处理应该用流式读取（本文件用内存中的字符串模拟这个过程）：
 *      import readline from 'node:readline';
 *      const rl = readline.createInterface({ input: fs.createReadStream(file) });
 *      for await (const line of rl) { ... }
 *    这样每次只在内存里保留一行，几十 GB 的文件也能处理。
 *    ---- 必须处理的边界情况 ----
 *      · 空行：应跳过
 *      · 行尾的 \r（Windows 换行 CRLF）：应去掉
 *      · 最后一行可能没有换行符：按 '\n' 切分自然处理
 *      · 单行损坏：应跳过并记录，而不是让整批数据解析失败
 *      · UTF-8 BOM：第一行开头可能带 ﻿，要剥掉
 *
 * 4. 常见陷阱
 *    (1) 用 JSON.stringify(x, null, 2) 生成 NDJSON —— 缩进会带来换行，格式直接坏掉。
 *    (2) 用 split('\n') 却不处理 '\r'，导致 Windows 生成的文件解析失败。
 *    (3) 不跳过空行，最后一行是空串时 JSON.parse('') 会抛错。
 *    (4) 一行坏了就让整个导入失败 —— 真实数据里脏行很常见，应该容错。
 *    (5) 以为 NDJSON 是"标准 JSON"：它整体不是合法 JSON，不能用 JSON.parse 整体解析。
 *    (6) 记录里包含未转义的换行符（比如日志内容里有 \n）—— stringify 会自动转义成
 *        "\\n"，所以只要老老实实用 JSON.stringify 就不会有问题。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/08_json_lines.js
 *
 * 【预期输出】
 *   演示 NDJSON 的生成、逐行解析、与"整段数组 JSON"的对比、
 *   容错解析（脏行 / 空行 / CRLF / BOM），以及一个模拟"流式处理百万行"的生成器写法。
 *   全程在内存中模拟，不读写外部文件，也不访问网络。
 * ============================================================================
 */

console.log('--- 1. 生成 NDJSON 文本 ---');

const logs = [
  { ts: '2026-09-16T10:00:00Z', level: 'INFO', msg: '服务启动' },
  { ts: '2026-09-16T10:00:05Z', level: 'WARN', msg: '磁盘使用率 85%' },
  { ts: '2026-09-16T10:00:10Z', level: 'ERROR', msg: '数据库连接超时\n重试中' }, // 消息里带换行
];

// 正确做法：JSON.stringify 不传缩进参数，拼接 '\n'。
const ndjson = logs.map((r) => JSON.stringify(r)).join('\n') + '\n';
console.log('  NDJSON 文本（每行一条记录）：');
console.log(ndjson.split('\n').slice(0, -1).map((l) => '    | ' + l).join('\n'));
console.log('  ↑ 注意第三条记录里的换行被自动转义成了 \\n 两个字符，所以它仍然只占一行。');

// 对比：普通 JSON 数组是把所有记录包在 [] 里，必须整体读写。
const arrayJson = JSON.stringify(logs, null, 2);
console.log('  同样的数据用 JSON 数组表示（前 6 行）：');
console.log(arrayJson.split('\n').slice(0, 6).map((l) => '    | ' + l).join('\n') + '\n    | …');

console.log('--- 2. 逐行解析 NDJSON ---');

// 最朴素的写法：按 \n 切分后逐行 JSON.parse。
const naiveLines = ndjson.split('\n');
console.log('  split("\\n") 之后的数组长度 =', naiveLines.length, '（最后一项是空串）');
const parsed = [];
for (const line of naiveLines) {
  if (line === '') continue; // 必须跳过空行，否则 JSON.parse('') 会抛错
  parsed.push(JSON.parse(line));
}
console.log('  解析出', parsed.length, '条记录：');
for (const r of parsed) {
  console.log(`    [${r.level}] ${JSON.stringify(r.msg)}`);
}

// 紧接着演示"不跳空行"的后果。
try {
  JSON.parse(naiveLines[naiveLines.length - 1]);
  console.log('  不会走到这里');
} catch (err) {
  console.log('  对空串 JSON.parse =>', err.constructor.name + ': ' + err.message.split('\n')[0]);
}

console.log('--- 3. 一个容错的 NDJSON 解析器 ---');

/**
 * 把 NDJSON 文本解析成记录数组。
 * 相比"裸 split + parse"，它额外处理了四种真实世界里一定会遇到的情况：
 *   ① UTF-8 BOM（﻿）—— Windows 记事本保存的文件常见
 *   ② CRLF 换行（\r\n）—— Windows 平台生成的文件常见
 *   ③ 空行 —— 文件末尾、或者人为留白
 *   ④ 单行损坏 —— 跳过并记录，而不是让整批失败
 * 返回值里同时给出"成功的记录"和"失败的行号与原因"，方便排查数据质量。
 */
function parseNdjson(text) {
  const records = [];
  const errors = [];

  // ① 去掉开头的 BOM
  const cleaned = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  // ② 统一换行：先把 \r\n 变成 \n（\r 单独出现也算换行）
  const normalized = cleaned.replace(/\r\n?/g, '\n');

  const lines = normalized.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim(); // 顺手去掉行首尾空白
    if (line === '') continue; // ③ 跳过空行
    try {
      records.push({ line: i + 1, value: JSON.parse(line) });
    } catch (err) {
      // ④ 记录错误但继续往下解析
      errors.push({ line: i + 1, text: line.slice(0, 40), reason: err.message.split('\n')[0] });
    }
  }
  return { records, errors };
}

// 构造一份"问题百出"的 NDJSON：BOM + CRLF + 空行 + 一行坏数据。
const messy =
  '﻿{"id":1,"ok":true}\r\n' +
  '{"id":2,"ok":true}\r\n' +
  '\r\n' +                          // 空行
  '{"id":3,"ok":} \r\n' +           // 坏行：值不完整
  '{id:4,ok:true}\r\n' +            // 坏行：键没加引号
  '{"id":5,"ok":true}\r\n';

const messyResult = parseNdjson(messy);
console.log('  成功解析', messyResult.records.length, '条：');
for (const r of messyResult.records) {
  console.log(`    第 ${r.line} 行 → ${JSON.stringify(r.value)}`);
}
console.log('  失败', messyResult.errors.length, '行：');
for (const e of messyResult.errors) {
  console.log(`    第 ${e.line} 行 "${e.text}" → ${e.reason}`);
}
console.log('  ↑ 一行坏数据不会毁掉整批导入，这是处理真实数据时最重要的设计。');

console.log('--- 4. 错误率监控：脏数据比例要能被观察 ---');

function summarizeNdjson(text) {
  const { records, errors } = parseNdjson(text);
  const total = records.length + errors.length;
  const badRate = total === 0 ? 0 : errors.length / total;
  return {
    总行数: total,
    成功: records.length,
    失败: errors.length,
    脏数据比例: `${(badRate * 100).toFixed(1)}%`,
    需要告警: badRate > 0.1, // 超过 10% 就认为上游数据有问题
  };
}
console.log('  上面那份脏数据的统计 =', JSON.stringify(summarizeNdjson(messy)));
console.log('  干净数据的统计 =', JSON.stringify(summarizeNdjson(ndjson)));

console.log('--- 5. 流式处理：一次只在内存里保留一行 ---');

/**
 * 模拟"从数据源逐行读取"的过程。
 * 现实里这里会是 fs.createReadStream + readline，或者网络 socket 的数据块。
 * 本文件用生成器函数模拟：每次 yield 一行，处理完就丢弃。
 */
function* lineReader(text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  let start = 0;
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i] === '\n') {
      yield normalized.slice(start, i);
      start = i + 1;
    }
  }
  if (start < normalized.length) yield normalized.slice(start); // 最后一行没有换行符
}

// 造一份"较大"的 NDJSON（5 万条），用来对比两种处理方式。
const bigCount = 50000;
const bigRecords = Array.from({ length: bigCount }, (_, i) =>
  JSON.stringify({ id: i, level: i % 7 === 0 ? 'ERROR' : 'INFO', ms: i % 100 }));
const bigText = bigRecords.join('\n') + '\n';
console.log('  模拟数据规模 =', bigCount, '条，文本大小 ≈', (bigText.length / 1024).toFixed(1), 'KB');

// 方式 A：整体解析（对应"JSON 数组"的做法）—— 必须把全部记录同时放进内存。
const t0 = performance.now();
const allAtOnce = bigText.split('\n').filter((l) => l !== '').map((l) => JSON.parse(l));
const t1 = performance.now();
const errorCountA = allAtOnce.filter((r) => r.level === 'ERROR').length;
console.log('  方式 A「整体读入数组」 耗时 =', (t1 - t0).toFixed(2), 'ms，ERROR 条数 =', errorCountA,
  '，峰值内存里同时存在', allAtOnce.length, '个对象');

// 方式 B：流式逐行处理 —— 内存里永远只有"当前这一行"与"统计量"。
const t2 = performance.now();
let countB = 0;
let errorCountB = 0;
let skipped = 0;
for (const line of lineReader(bigText)) {
  if (line.trim() === '') { skipped++; continue; }
  let rec;
  try {
    rec = JSON.parse(line);
  } catch {
    skipped++; // 脏行直接跳过
    continue;
  }
  countB++;
  if (rec.level === 'ERROR') errorCountB++;
}
const t3 = performance.now();
console.log('  方式 B「流式逐行处理」 耗时 =', (t3 - t2).toFixed(2), 'ms，ERROR 条数 =', errorCountB,
  '，内存里同时只保留 1 条记录');
console.log('  跳过的空行/脏行 =', skipped);
console.log('  两种方式的 ERROR 统计是否一致 =', errorCountA === errorCountB);
console.log('  ↑ 本示例数据在内存里，所以耗时接近；真正的差别在于"内存占用"：');
console.log('    方式 A 的对象数随总行数线性增长，方式 B 则是一个常量。');

console.log('--- 6. 现实中的流式读法（注释示意，本示例不执行文件 IO） ---');

console.log(`  // 用 node:readline 处理一个几十 GB 的 .jsonl 文件：
  import { createReadStream } from 'node:fs';
  import readline from 'node:readline';

  const rl = readline.createInterface({
    input: createReadStream('big.jsonl', { encoding: 'utf8' }),
    crlfDelay: Infinity,   // 把 \\r\\n 当成一个换行
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      await handle(record);     // 逐条处理，内存占用恒定
    } catch (err) {
      recordBadLine(line, err); // 脏行单独记录，不中断整个任务
    }
  }
`.trimEnd().split('\n').map((l) => '    ' + l).join('\n'));

console.log('  提示：crlfDelay: Infinity 就是用来把 CRLF 识别成单个换行，');
console.log('        不然 Windows 生成的文件每行末尾都会多出一个 \\r。');

console.log('--- 7. 追加写入：NDJSON 相对 JSON 数组的最大优势 ---');

// 模拟"往同一份数据里追加一条"：
//   · JSON 数组：必须把整个数组读出来、push、再整体写回 —— O(全部数据)
//   · NDJSON：只需要在末尾追加一行 —— O(单条数据)
const existing = ['{"id":1}', '{"id":2}'].join('\n') + '\n';
const appended = existing + JSON.stringify({ id: 3 }) + '\n';
console.log('  追加前的行数 =', existing.trim().split('\n').length);
console.log('  追加后的行数 =', appended.trim().split('\n').length);
console.log('  仅新增的字节数 =', appended.length - existing.length, '（就是"{"id":3}\\n"这一行的长度）');
console.log('  ↑ 这就是日志、埋点、事件流几乎都用 NDJSON 的原因。');

console.log('--- 8. 两种格式的选型对照 ---');

const table = [
  ['整体是否合法 JSON', '是', '否（整体不是 JSON）'],
  ['能否整体 JSON.parse', '可以', '必须先按换行切分'],
  ['增量追加', '要重写整个文件', '末尾加一行即可'],
  ['内存占用', '与总数据量成正比', '与单条记录大小成正比'],
  ['适合的场景', '配置、接口响应、小数据快照', '日志、事件流、大数据导出'],
  ['可读性', '美化后非常好读', '每条一行，也相当好读'],
  ['单条损坏的影响', '整个文件报废', '只丢这一条'],
];
console.log('  ' + '对比项'.padEnd(24) + 'JSON 数组'.padEnd(28) + 'JSON Lines');
for (const [item, arr, nd] of table) {
  console.log('  ' + item.padEnd(24) + arr.padEnd(28) + nd);
}

console.log('--- 9. 小结 ---');
console.log('· NDJSON = 一行一个 JSON 值，整体不是合法 JSON，必须逐行解析。');
console.log('· 生成时用 JSON.stringify(x)（不要传缩进！）再拼 "\\n"。');
console.log('· 解析时务必处理：BOM、CRLF、空行、脏行这四种边界情况。');
console.log('· 大文件请用流式读取（readline + for await），让内存占用与总行数解耦。');
console.log('· 需要"不断追加"的场景（日志、事件流）优先选 NDJSON。');
