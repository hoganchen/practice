/**
 * ============================================================================
 * 知识点：Source Map 原理 —— mappings 字段、VLQ 编码与"生成位置→原始位置"映射
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】高级
 * 【前置知识】20_error_handling/03_error_properties.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Source Map（源映射）是一份 JSON，用来描述"压缩/转译后的代码"与"原始源码"
 *    之间的位置对应关系。它回答一个问题：
 *      "生成产物里的第 X 行第 Y 列，对应我写的源文件里的哪一行哪一列？"
 *    有了它，构建工具产出的那份"人看不懂"的代码，在报错和断点时可以
 *    还原回你写的源码位置。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 前端：打包压缩后所有变量都变成 a/b/c、所有代码挤在一行，
 *      线上报错的行列号毫无意义，必须靠 Source Map 还原；
 *    - TypeScript / Babel：编译产物与源码结构不同（类型被删、语法被降级），
 *      断点必须靠映射才能对得上；
 *    - Node 服务端：用 tsc/esbuild 构建出的 dist/ 报错，
 *      要能对回 src/ 里的那一行；
 *    - 错误监控平台（Sentry 等）：上传 Source Map 才能把线上栈还原成源码栈。
 *
 * 3. 核心语法要点
 *    (1) Source Map 的关键字段：
 *        version: 3            目前固定是 3
 *        file: 产物文件名      可选
 *        sources: [源文件路径]  映射里用"下标"引用它
 *        sourcesContent: [源码] 可选，把源码原文内嵌进来
 *        names: [标识符名]      映射里用"下标"引用，主要服务于压缩后的变量名
 *        mappings: "..."       本示例的主角，一串用分号和逗号分隔的 VLQ 编码
 *    (2) mappings 的层级结构：分号分行，逗号分段，一段内的数字用 VLQ 编码：
 *        · 分号 ;  → 分隔"生成代码的每一行"（第 N 段对应生成代码第 N 行）
 *        · 逗号 ,  → 分隔同一行内的若干"映射段"
 *        · 每个段由 1、4 或 5 个 VLQ 数字组成，含义固定：
 *            [生成列, 源文件下标, 原始行, 原始列, (标识符下标)]
 *          其中"源文件下标/原始行/原始列/标识符下标"都是【相对上一个段】的增量，
 *          "生成列"是【相对同一行内上一个段】的增量，每换一行生成列重置为 0。
 *    (3) VLQ（Variable Length Quantity，变长量）：
 *        把整数变成"若干 5 位一组"的二进制，每组用一位表示"后面还有没有"，
 *        再把这 5 位映射到 Base64 字符表（A-Z a-z 0-9 + /）。
 *        最低位是符号位（1 表示负数），其余位是数值。
 *        这样 0 只占 1 个字符，而负数、大数也能表示，非常适合"差值通常很小"的场景。
 *    (4) 查找规则：给定生成位置 (行, 列)，在该行里找"生成列 <= 目标列"的
 *        最后一个段，它的原始行列就是答案；如果该行没有任何段，
 *        就继续向上找最近的有段的行（不同工具的实现细节略有差异）。
 *    (5) 关联方式：产物文件末尾写一行注释
 *          //# sourceMappingURL=xxx.js.map
 *        或者把整份 map 用 Base64 内联成 data URI（省一次请求）。
 *
 * 4. 常见陷阱
 *    - 陷阱一：行列的【基准不同】。Source Map 里的行列都是 0 基（从 0 开始），
 *      而 JS 引擎在栈里给的行号是 1 基、列号也是 1 基。
 *      直接拿栈里的位置去查映射，会整体偏一位——这是最常见的"差一行"来源。
 *    - 陷阱二：把 .map 文件和产物一起部署到公网。map 里可能带 sourcesContent
 *      （源码原文），等于把源码公开了。正确做法是只把 map 上传到错误监控平台。
 *    - 陷阱三：产物更新了但 map 没更新（版本错配），映射出来的位置全是错的，
 *      而且不报错，只是"看起来对不上"。所以 map 必须和产物一起版本化。
 *    - 陷阱四：以为 Source Map 能还原"变量名"。names 字段只提供标识符名，
 *      原始作用域结构是还原不出来的——源码就是源码，map 只是位置对应表。
 *    - 陷阱五：在生产环境开着 inlineSourceMap / eval-source-map，
 *      map 体积会显著增大构建产物，还会拖慢启动。
 *    - 陷阱六：只映射了行、没映射列时，列号会落到段起点，
 *      所以精确到列的定位（比如"是哪个属性访问报错"）可能不准。
 *
 * 【关于本示例】
 *    本示例【不生成任何文件】，整份 Source Map 在内存里构造、编码、解码、
 *    查询位置，并打印每一步的中间结果，方便你对照着理解 VLQ 到底在做什么。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/03_source_maps.js
 *
 * 【预期输出】
 *   打印 7 个小节：为什么需要、map 的 JSON 结构、VLQ 编码实测、手写最小 map、
 *   映射查询算法、把错误位置还原回源码、以及真实工具链怎么接。
 * ============================================================================
 */

const SCRIPT_START = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

/** 打印带行号的代码块，方便对照"第几行第几列" */
function printNumberedCode(title, lines) {
  console.log(`${title}：`);
  lines.forEach((line, i) => {
    console.log(`  ${String(i + 1).padStart(2)} | ${line}`);
  });
}

// ---------------------------------------------------------------------------
// 1. 先看问题：没有 Source Map 时，栈里的位置毫无意义
// ---------------------------------------------------------------------------

section(1, '为什么需要 Source Map');

// 下面这两段代码就是"源码"与"构建产物"的关系：
// 产物把类型标注删掉、整体包进 IIFE、并多缩进了 2 个空格。
const originalSource = [
  'interface User {', // 第 1 行
  '  id: number;', // 第 2 行
  '  name: string;', // 第 3 行
  '}', // 第 4 行
  '', // 第 5 行
  'function greet(user: User): string {', // 第 6 行
  '  return `你好，${user.name}`;', // 第 7 行
  '}', // 第 8 行
  '', // 第 9 行
  "console.log(greet({ id: 1, name: 'Ada' }));", // 第 10 行
];

const generatedSource = [
  '"use strict";', // 第 1 行
  '(function () {', // 第 2 行
  '  function greet(user) {', // 第 3 行
  '    return `你好，${user.name}`;', // 第 4 行
  '  }', // 第 5 行
  "  console.log(greet({ id: 1, name: 'Ada' }));", // 第 6 行
  '})();', // 第 7 行
];

printNumberedCode('原始源码（src/demo.ts，你写的那份）', originalSource);
console.log('');
printNumberedCode('构建产物（dist/demo.js，机器跑的那份）', generatedSource);
console.log('');
console.log('假设运行时在第 4 行第 18 列报了一个错（模板串里的 `user` 是 undefined）。');
console.log('  没有 Source Map 时你能看到的只有："dist/demo.js:4:18 出错"。');
console.log('  而你要改的那一行其实是 src/demo.ts 的第 7 行。');
console.log('  Source Map 干的事情，就是把这个"第 4 行第 18 列"翻译成"第 7 行第 16 列"。');
console.log('');
console.log('注意两者的列基准：');
console.log('  · JS 引擎在栈里给的是【1 基】行列（第 4 行第 18 列，人话叫法）；');
console.log('  · Source Map 的 mappings 里存的是【0 基】行列（行 3、列 17）。');
console.log('  这个 1 的差值就是很多"映射结果差一行/差一列"问题的根源。');

// ---------------------------------------------------------------------------
// 2. Source Map 的 JSON 结构
// ---------------------------------------------------------------------------

section(2, 'Source Map 的 JSON 结构');

const mapSkeleton = {
  version: 3,
  file: 'demo.js',
  sourceRoot: '',
  sources: ['../src/demo.ts'],
  sourcesContent: ['（原文内容，本示例为节省篇幅从略）'],
  names: [],
  mappings: '（下一节开始自己生成）',
};

console.log('一份标准的 Source Map 长这样（mappings 先留空）：');
console.log(
  JSON.stringify(mapSkeleton, null, 2)
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n'),
);
console.log('');
console.log('逐字段说明：');
console.log('  version        固定 3。第 1、2 版早已废弃，看到别的值说明工具太老。');
console.log('  file           这份 map 描述的产物文件名（可选，用于校验）。');
console.log('  sourceRoot     拼接在 sources 前面的前缀（可选，实际项目里常为空）。');
console.log('  sources        源文件路径数组。mappings 里用【下标】引用它，');
console.log('                 所以一个产物合并了 50 个源文件时，这里就有 50 项。');
console.log('  sourcesContent 源码原文数组，下标与 sources 一一对应（可选）。');
console.log('                 内嵌源码的 map 可以在没有源文件的环境里还原出完整源码，');
console.log('                 代价是 map 体积变大——而且这等于把源码交出去了。');
console.log('  names          标识符名数组（如 ["greet", "user"]），mappings 里用下标引用。');
console.log('                 压缩工具靠它记录"a 原来是 greet"。');
console.log('  mappings       核心字段，一串 Base64 VLQ 编码，下一节详细拆。');

// ---------------------------------------------------------------------------
// 3. VLQ 编码：把整数压成最短的 Base64 字符
// ---------------------------------------------------------------------------

section(3, 'VLQ 编码原理与实测');

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_VALUE = new Map([...BASE64_CHARS].map((ch, i) => [ch, i]));

/**
 * 把整数编码成 Base64 VLQ 字符串。
 * 规则：
 *   ① 取绝对值左移 1 位，最低位放符号（负数时最低位为 1）；
 *   ② 从低位开始每 5 位切一组，最高位（第 6 位）作为"续位"：
 *      还有后续组就置 1，否则置 0；
 *   ③ 每组查 Base64 字符表，得到最终字符串。
 */
function encodeVLQ(value) {
  // ① 符号位放进最低位
  let vlq = value < 0 ? (-value << 1) | 1 : value << 1;
  let out = '';
  do {
    let digit = vlq & 0b11111; // ② 取低 5 位
    vlq >>>= 5; // 无符号右移，处理过的位丢掉
    if (vlq > 0) digit |= 0b100000; // 还有后续 → 续位置 1
    out += BASE64_CHARS[digit]; // ③ 查表
  } while (vlq > 0);
  return out;
}

/**
 * 解码：从字符串的 pos 位置开始读一个 VLQ，返回 { value, next }。
 * next 是下一个 VLQ 的起始下标，这样一个段里的多个数字可以连续读。
 */
function decodeVLQ(str, pos) {
  let result = 0;
  let shift = 0;
  let digit;
  let continuation;
  do {
    digit = BASE64_VALUE.get(str[pos]);
    if (digit === undefined) throw new Error(`不是合法的 Base64 VLQ 字符："${str[pos]}"（位置 ${pos}）`);
    pos += 1;
    continuation = digit & 0b100000; // 续位
    result += (digit & 0b11111) << shift; // 取出本组 5 位，放到对应位置
    shift += 5;
  } while (continuation);

  const isNegative = result & 1; // 最低位是符号位
  result >>>= 1; // 剩下的才是数值
  return { value: isNegative ? -result : result, next: pos };
}

console.log('Base64 字符表（VLQ 的"数字"就是它的下标）：');
console.log(`  ${BASE64_CHARS}`);
console.log('  下标 0=A，25=Z，26=a，51=z，52=0，61=9，62=+，63=/');
console.log('');

const vlqSamples = [
  0, 1, -1, 2, -2, 15, 16, -16, 31, 32, 100, -100, 1000, -1000, 12345,
];
console.log('整数 → VLQ 字符串（可以直观看到"小数字很短"）：');
console.log('  数值'.padEnd(12) + 'VLQ'.padEnd(12) + '字符数'.padEnd(10) + '二进制（含续位与符号位）');
console.log('  ' + '-'.repeat(72));
for (const n of vlqSamples) {
  const encoded = encodeVLQ(n);
  // 展示每个字符对应的 6 位二进制
  const bits = [...encoded]
    .map((ch) => BASE64_VALUE.get(ch).toString(2).padStart(6, '0'))
    .join(' ');
  console.log(`  ${String(n).padEnd(10)}${encoded.padEnd(12)}${String(encoded.length).padEnd(10)}${bits}`);
}
console.log('');
console.log('观察结论：');
console.log('  · 0 编码成 "A"，1 编码成 "C"，-1 编码成 "D" —— 单字符就能表达，');
console.log('    而 Source Map 里绝大多数数字都是"相对上一个段的小增量"，所以整体很紧凑；');
console.log('  · 每多一个字符，就多承载 5 位有效信息（每组的最高位是续位，不算数据）；');
console.log('  · 符号位是最低位而不是最高位，所以 -1 (=D) 只比 1 (=C) 大 1。');

// 往返一致性校验：编码后再解码，必须还原成原值
let roundTripOk = true;
for (let n = -2000; n <= 2000; n++) {
  const { value, next } = decodeVLQ(encodeVLQ(n), 0);
  if (value !== n || next !== encodeVLQ(n).length) {
    roundTripOk = false;
    break;
  }
}
console.log('');
console.log(`往返校验：对 -2000..2000 共 4001 个整数做"编码→解码"，全部还原一致 = ${roundTripOk}`);

// ---------------------------------------------------------------------------
// 4. 手写一个最小的 Source Map
// ---------------------------------------------------------------------------

section(4, '手写映射表：生成 mappings 字段');

// 这就是构建工具会产出的"映射表"：每一步告诉我们
// "生成代码的 (line, column) 对应源文件的 (line, column)"。
// 注意这里的行列一律是【0 基】。
//
// 对照第 1 节的两个代码块，我们能手工写出这一组对应关系：
//   产物第 3 行第 2 列（function greet(user) {）  ← 源码第 6 行第 0 列
//   产物第 4 行第 4 列（return ...）              ← 源码第 7 行第 2 列
//   产物第 4 行第 17 列（模板串里的 user）        ← 源码第 7 行第 15 列
//   产物第 6 行第 2 列（console.log(...)）        ← 源码第 10 行第 0 列
//
// 注意第三条：真实工具（tsc/esbuild/terser）会为每个标识符都放一个映射段，
// 所以列号能精确到 token 级别。本示例只放少量段，已足够讲清原理。
const sourceIndex = 0; // 只涉及一个源文件，所以固定下标 0

// 每一行是"该生成行里的映射段数组"，段的内容是【绝对】行列，
// 由 encodeMappings 负责转成"增量 + VLQ"——这样写起来和读起来都接近人话。
const absoluteMappingLines = [
  [], // 产物第 1 行 "use strict"; 没有对应源码
  [], // 产物第 2 行 (function () { 是工具加的外壳，也没有对应源码
  [[2, sourceIndex, 5, 0]], // 产物第 3 行 第 2 列 ← 源码第 6 行(0基是 5) 第 0 列
  [
    [4, sourceIndex, 6, 2], // 产物第 4 行 第 4 列 ← 源码第 7 行(0基是 6) 第 2 列
    [17, sourceIndex, 6, 15], // 产物第 4 行 第 17 列 ← 源码第 7 行 第 15 列（user 这个名字）
  ],
  [], // 产物第 5 行 } 没有语句，不映射
  [[2, sourceIndex, 9, 0]], // 产物第 6 行 第 2 列 ← 源码第 10 行(0基是 9) 第 0 列
  [], // 产物第 7 行 })(); 是外壳
];

/**
 * 把"绝对位置"的映射表编码成 mappings 字符串。
 * 关键点：写进字符串里的必须是【增量】：
 *   · 生成列 → 相对【同一行内上一个段】的增量，换行后重置为 0；
 *   · 源文件下标 / 原始行 / 原始列 / 标识符下标 → 相对【上一个段】的增量，跨行累加。
 */
function encodeMappings(lines) {
  let prevSourceIndex = 0;
  let prevOriginalLine = 0;
  let prevOriginalColumn = 0;
  let prevNameIndex = 0;

  return lines
    .map((segments) => {
      let prevGeneratedColumn = 0; // 每换一行，生成列重置
      return segments
        .map((seg) => {
          const [generatedColumn, srcIdx, originalLine, originalColumn, nameIdx] = seg;
          let out = encodeVLQ(generatedColumn - prevGeneratedColumn);
          prevGeneratedColumn = generatedColumn;

          if (srcIdx !== undefined) {
            out += encodeVLQ(srcIdx - prevSourceIndex);
            prevSourceIndex = srcIdx;
          }
          if (originalLine !== undefined) {
            out += encodeVLQ(originalLine - prevOriginalLine);
            prevOriginalLine = originalLine;
          }
          if (originalColumn !== undefined) {
            out += encodeVLQ(originalColumn - prevOriginalColumn);
            prevOriginalColumn = originalColumn;
          }
          if (nameIdx !== undefined) {
            out += encodeVLQ(nameIdx - prevNameIndex);
            prevNameIndex = nameIdx;
          }
          return out;
        })
        .join(','); // 同一行内多个段用逗号分隔
    })
    .join(';'); // 行与行之间用分号分隔
}

const mappings = encodeMappings(absoluteMappingLines);

/** 反向：把 mappings 字符串解回"绝对的 0 基行列"映射表 */
function decodeMappings(mappingsStr) {
  let srcIdx = 0;
  let originalLine = 0;
  let originalColumn = 0;
  let nameIdx = 0;

  return mappingsStr.split(';').map((lineStr) => {
    let generatedColumn = 0;
    if (lineStr === '') return []; // 这一行没有任何映射段
    return lineStr.split(',').map((segStr) => {
      let pos = 0;
      let r = decodeVLQ(segStr, pos);
      generatedColumn += r.value;
      pos = r.next;
      const segment = { generatedColumn };

      if (pos < segStr.length) {
        r = decodeVLQ(segStr, pos);
        srcIdx += r.value;
        pos = r.next;
        segment.sourceIndex = srcIdx;
      }
      if (pos < segStr.length) {
        r = decodeVLQ(segStr, pos);
        originalLine += r.value;
        pos = r.next;
        segment.originalLine = originalLine;
      }
      if (pos < segStr.length) {
        r = decodeVLQ(segStr, pos);
        originalColumn += r.value;
        pos = r.next;
        segment.originalColumn = originalColumn;
      }
      if (pos < segStr.length) {
        r = decodeVLQ(segStr, pos);
        nameIdx += r.value;
        pos = r.next;
        segment.nameIndex = nameIdx;
      }
      return segment;
    });
  });
}

console.log('刚才那张映射表，编码后的 mappings 字符串是：');
console.log(`  "${mappings}"`);
console.log('');
console.log('把它按分号拆开，逐个生成行看：');
mappings.split(';').forEach((lineStr, i) => {
  console.log(`  产物第 ${i + 1} 行 → "${lineStr}"${lineStr === '' ? '   （空 = 这一行没有映射）' : ''}`);
});
console.log('');
console.log('再解码回来，验证"编码 → 解码"完全一致：');
const decoded = decodeMappings(mappings);
let decodeMatches = true;
decoded.forEach((segs, lineIdx) => {
  segs.forEach((seg, segIdx) => {
    const [g, s, ol, oc] = absoluteMappingLines[lineIdx][segIdx];
    if (seg.generatedColumn !== g || seg.sourceIndex !== s || seg.originalLine !== ol || seg.originalColumn !== oc) {
      decodeMatches = false;
    }
  });
});
console.log(`  解码结果与原始映射表逐项一致 = ${decodeMatches}`);
console.log('');
console.log('打印解码后的完整映射表（已经是"绝对的 0 基行列"）：');
console.log('  产物行:列'.padEnd(16) + '→  源码行:列'.padEnd(16) + '说明');
console.log('  ' + '-'.repeat(78));
decoded.forEach((segs, lineIdx) => {
  for (const seg of segs) {
    const from = `${lineIdx}:${seg.generatedColumn}`;
    const to = `${seg.originalLine}:${seg.originalColumn}`;
    const note = generatedSource[lineIdx].trim().slice(0, 28);
    console.log(`  ${from.padEnd(14)}→  ${to.padEnd(14)}${note}`);
  }
});

// 组装成一份完整的、合法的 Source Map 对象
const sourceMap = {
  version: 3,
  file: 'demo.js',
  sources: ['../src/demo.ts'],
  names: [],
  mappings,
};
console.log('');
console.log('组装出的完整 Source Map（体积很小，因为位置信息被压得很紧）：');
console.log(`  ${JSON.stringify(sourceMap)}`);
console.log(`  字符串长度：${JSON.stringify(sourceMap).length} 字符`);

// ---------------------------------------------------------------------------
// 5. 映射查询算法：从"生成位置"找"原始位置"
// ---------------------------------------------------------------------------

section(5, '映射查询算法：originalPositionFor');

/**
 * 按 Source Map 规范查找某个生成位置对应的原始位置。
 *
 * @param {object} map      Source Map 对象
 * @param {number} line     生成代码的行（0 基）
 * @param {number} column   生成代码的列（0 基）
 * @returns {{source:string, line:number, column:number, name?:string} | null}
 *
 * 规则要点：
 *   ① 只看"生成列 <= 目标列"的段，取其中【最后一个】——因为一个段一直有效到下一段开始；
 *   ② 如果该行没有任何段，就继续向上找最近的有段的行（这里演示最简单的"向上找"策略）；
 *   ③ 返回的行列仍然是 0 基，要给人看时需要 +1。
 */
function originalPositionFor(map, line, column) {
  const lines = decodeMappings(map.mappings);

  let cursorLine = line;
  while (cursorLine >= 0) {
    const segments = lines[cursorLine] ?? [];
    let found = null;
    for (const seg of segments) {
      if (seg.generatedColumn <= column) found = seg;
      else break; // 段是按生成列升序排列的，一旦超过就可以停
    }
    if (found && found.originalLine !== undefined) {
      return {
        source: map.sources[found.sourceIndex] ?? '(未知源文件)',
        line: found.originalLine,
        column: found.originalColumn,
      };
    }
    cursorLine -= 1; // 本行没有可用段，向上找
  }
  return null;
}

/** 把引擎栈里的 1 基行列转成 Source Map 用的 0 基 */
function fromStackTracePosition(stackLine, stackColumn) {
  return { line: stackLine - 1, column: stackColumn - 1 };
}

const lookupDemo = [
  { line: 3, column: 17, note: '报错位置：生成第 4 行第 18 列(1基) 的 user' },
  { line: 3, column: 16, note: '再往左一列：早于 user 段，落到上一个段' },
  { line: 3, column: 10, note: '同一行但更靠前，仍然落到上一个段' },
  { line: 3, column: 0, note: '第 4 行开头' },
  { line: 2, column: 2, note: '函数声明这一行' },
  { line: 4, column: 0, note: '生成第 5 行（}）——本行没有段，会向上找' },
  { line: 5, column: 2, note: 'console.log 那一行' },
  { line: 0, column: 0, note: '工具加的外壳行，没有映射 → 返回 null' },
];

console.log('把几个"生成位置"丢进查询函数，看它还原到源码的哪里：');
console.log('  生成(0基)'.padEnd(16) + '→ 源码(0基)'.padEnd(16) + '给人类看(+1)'.padEnd(18) + '说明');
console.log('  ' + '-'.repeat(90));
for (const item of lookupDemo) {
  const hit = originalPositionFor(sourceMap, item.line, item.column);
  const from = `${item.line}:${item.column}`;
  if (hit) {
    const to = `${hit.line}:${hit.column}`;
    const human = `${hit.source}:${hit.line + 1}:${hit.column + 1}`;
    console.log(`  ${from.padEnd(14)}→  ${to.padEnd(14)}${human.padEnd(24)}${item.note}`);
  } else {
    console.log(`  ${from.padEnd(14)}→  ${'(无映射)'.padEnd(14)}${''.padEnd(18)}${item.note}`);
  }
}
console.log('');
console.log('注意最后一行：产物第 1 行是工具加的外壳，没有映射段，');
console.log('  查询会一路向上找到第 0 行之前，最终返回 null。');
console.log('  真实工具里遇到这种情况通常返回"最近的上一个有效映射"或者原样返回。');

// ---------------------------------------------------------------------------
// 6. 完整演练：还原一次运行时报错
// ---------------------------------------------------------------------------

section(6, '完整演练：把运行时错误的栈还原成源码位置');

// 模拟引擎给出的栈（注意：栈里的行列是 1 基！）
const fakeStackLines = [
  'TypeError: Cannot read properties of undefined (reading \'name\')',
  '    at greet (dist/demo.js:4:18)', // ← 生成代码里的第 4 行第 18 列（1 基）
  '    at dist/demo.js:5:3',
];

console.log('构建产物在线上报错，错误监控平台里只看到这样的栈：');
fakeStackLines.forEach((l) => console.log(`  ${l}`));
console.log('');
console.log('用 Source Map 还原（关键动作：先 −1 转成 0 基）：');

const parseLocation = (frame) => {
  const m = /:(\d+):(\d+)\)?$/.exec(frame);
  return m ? { line: Number(m[1]), column: Number(m[2]) } : null;
};

for (const frame of fakeStackLines.slice(1)) {
  const stackPos = parseLocation(frame);
  if (!stackPos) continue;
  const zeroBased = fromStackTracePosition(stackPos.line, stackPos.column);
  const hit = originalPositionFor(sourceMap, zeroBased.line, zeroBased.column);
  console.log('');
  console.log(`  产物位置 ${frame.split(' ').pop()} ——1基(${stackPos.line}:${stackPos.column}) 0基(${zeroBased.line}:${zeroBased.column})`);
  if (hit) {
    console.log(`    → 还原为 ${hit.source}:${hit.line + 1}:${hit.column + 1}`);
    console.log(`      对应源码这一行：${originalSource[hit.line]}`);
    // 用还原出来的列号再从源码里切一小段，直观展示"列"的含义
    const slice = originalSource[hit.line].slice(hit.column, hit.column + 10);
    console.log(`      从这一列开始往右 10 个字符："${slice}"`);
  } else {
    console.log('    → 没有找到映射（这一行是工具生成的外壳代码）');
  }
}

console.log('');
console.log('这就是所有错误监控平台的核心动作：');
console.log('  ① 拿到压缩/转译后的栈；');
console.log('  ② 把每个帧的 1 基行列转成 0 基；');
console.log('  ③ 查 Source Map，得到源码位置；');
console.log('  ④ 用 sourcesContent（或本地源码）把出错那一行原文贴出来；');
console.log('  ⑤ 按"还原后的文件+行号"做聚合、去重、分派。');

// ---------------------------------------------------------------------------
// 7. 真实工具链怎么接
// ---------------------------------------------------------------------------

section(7, '真实工具链里怎么用');

console.log('(1) 产物如何声明自己有一份 map —— 文件末尾加一行注释：');
console.log('  //# sourceMappingURL=demo.js.map');
console.log('  旧写法 //@ sourceMappingURL=... 已被废弃，工具仍会兼容。');
console.log('');
console.log('(2) 内联成 data URI（省一次 HTTP 请求，代价是产物变大）：');
const inlineMap = `data:application/json;base64,${Buffer.from(JSON.stringify(sourceMap)).toString('base64')}`;
console.log(`  //# sourceMappingURL=${inlineMap.slice(0, 68)}...`);
console.log(`  完整长度：${inlineMap.length} 字符（本示例这份极小，真实的 map 动辄几 MB）`);
console.log('');
console.log('(3) Node.js 侧让栈自动还原（无需改代码）：');
console.log('  $ node --enable-source-maps dist/demo.js');
console.log('  或者运行时打开：');
console.log('    process.setSourceMapsEnabled(true);');
console.log(`  本环境支持 process.setSourceMapsEnabled 吗？ ${typeof process.setSourceMapsEnabled === 'function'}`);
console.log('  打开之后，err.stack 里的位置会被自动替换成源码位置');
console.log('  （对应的原始文件路径会显示在栈里，并在末尾附加原始文件名）。');
console.log('');
console.log('(4) 自己控制映射结果——把 Source Map 接到 Error.prepareStackTrace 上：');
console.log('    Error.prepareStackTrace = (err, frames) => frames.map(f => {');
console.log('      const pos = originalPositionFor(sourceMap, f.getLineNumber() - 1, f.getColumnNumber() - 1);');
console.log('      return pos ? `${pos.source}:${pos.line + 1}:${pos.column + 1}` : f.toString();');
console.log('    });');
console.log('  早期大家用 source-map-support 这个包就是干这件事的；');
console.log('  现在 Node 内置了 --enable-source-maps，一般不再需要它。');
console.log('');
console.log('(5) 常见库与工具的分工：');
console.log('  · 生成 map：tsc（--sourceMap）、esbuild（--sourcemap）、');
console.log('    webpack（devtool: "source-map"）、Rollup/Vite（build.sourcemap: true）；');
console.log('  · 消费 map：浏览器 DevTools、Node 的 --enable-source-maps、');
console.log('    Sentry 等监控平台的"上传 sourcemap"流程；');
console.log('  · 手动处理：Mozilla 的 source-map 库、@jridgewell/trace-mapping');
console.log('    （Vite/Rollup 生态在用），它们提供 originalPositionFor / generatedPositionFor；');
console.log('  · 反向查找：generatedPositionFor 可以根据源码位置找出产物位置，');
console.log('    用于"在源码里设断点、让调试器在产物里停下"。');
console.log('');
console.log('(6) 一个常被忽略的场景：Node 服务端构建。');
console.log('    dist/server.js 报错时同样需要 map，做法是：');
console.log('      构建时产出 .map → 部署时带上 → 启动加 --enable-source-maps；');
console.log('    如果不想把 map 部署到服务器，就上传到 APM 平台，');
console.log('    用平台自己的解析流程还原（这一步需要 release/版本号对齐）。');

// ---------------------------------------------------------------------------
// 8. 陷阱与清单
// ---------------------------------------------------------------------------

section(8, '陷阱与检查清单');

const checklist = [
  ['查询前把栈里的 1 基行列减 1', 'map 里是 0 基，不减就会"差一行/差一列"'],
  ['不要公开部署 .map 文件', 'sourcesContent 里可能内嵌源码原文，等于公开源码'],
  ['map 必须和产物一起版本化', '版本错配时映射不报错，只是位置全错'],
  ['生产构建用 external 而非 inline map', '内联 map 会显著增大产物、拖慢启动'],
  ['注意 sources 路径是相对的', '它相对 map 文件所在目录，部署结构变了就会找不到'],
  ['Source Map 不能还原作用域', '它只是位置对应表，变量名还原仅靠 names 字段'],
  ['列级映射可能不精确', '很多工具只按行/段映射，列会落到段起点'],
  ['线上还原失败时先查是哪个版本的 map', '先确认 release 对齐，再怀疑算法'],
];

console.log('要点'.padEnd(42) + '说明');
console.log('-'.repeat(96));
for (const [item, reason] of checklist) {
  console.log(item.padEnd(40) + reason);
}

console.log('');
console.log('最后用一句话收束：mappings 就是一张"用 VLQ 压扁的位置对应表"，');
console.log('  分号分行、逗号分段、段内是相对上一个段的增量 —— 理解了这三句，');
console.log('  你就理解了 Source Map 的全部核心。');

console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
