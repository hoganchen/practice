/**
 * ============================================================================
 * 知识点：解析自定义二进制格式 —— 内存中构造「文件头 + 变长记录」并完整解析
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】高级
 * 【前置知识】24_typed_arrays/02_dataview.js、05_multiple_views.js、06_textencoder_decoder.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本文件把前面几节的知识串成一个实战：定义一种自己的二进制文件格式
 *    （.bdat），在内存里把它**写出来**，再把它**读回去**。
 *    整个过程不碰外部文件，所有数据都在 ArrayBuffer 里构造 —— 这正是
 *    "解析 PNG / ZIP / TCP 报文"这类任务的完整缩影。
 *
 * 2. 为什么需要
 *    文本格式（JSON、XML、CSV）易读但体积大、解析慢、无法表达二进制。
 *    真实世界的图片、音视频、数据库文件、网络协议全部是二进制格式，
 *    它们的共同结构就是：**固定长度的头部 + 变长/重复的数据体**。
 *    学会"按偏移读出每个字段"，就掌握了所有二进制格式的解析方法。
 *
 * 3. 我们自定义的格式规范（BDAT v1）
 *
 *    文件头（固定 16 字节，全部使用**大端序**，即网络字节序）：
 *      偏移 0   长度 4   魔数 "BDAT"（0x42 0x44 0x41 0x54）
 *      偏移 4   长度 2   格式版本号（uint16，本文件为 1）
 *      偏移 6   长度 2   记录条数（uint16）
 *      偏移 8   长度 4   数据区起始偏移（uint32，即 16）
 *      偏移 12  长度 4   校验和（uint32，所有记录 value 之和，溢出按 32 位截断）
 *
 *    每条记录（变长，字段使用**小端序** —— 故意与头部相反，
 *              因为现实中"头部大端、数据体小端"的混合格式非常常见）：
 *      相对偏移 0            长度 1        记录类型 tag（0x01=整数，0x02=文本）
 *      相对偏移 1            长度 2        名称字节长度 nameLen（uint16 LE）
 *      相对偏移 3            长度 nameLen  名称（UTF-8 编码）
 *      相对偏移 3+nameLen    长度 4        数值 value（uint32 LE）
 *      相对偏移 7+nameLen    长度 1        标志位 flags（bit0 = 是否激活）
 *
 *    单条记录总长度 = 1 + 2 + nameLen + 4 + 1 = 8 + nameLen
 *
 * 4. 常见陷阱
 *    - 字节序搞反：头部用大端、记录用小端，读的时候必须一一对应，否则全是垃圾数。
 *    - 偏移算错一位，后面全错。所以代码里一律用"记录起点 + 相对偏移"的方式表达，
 *      并把每个相对偏移写成常量。
 *    - 变长字段必须先读长度，再按长度推进游标；推进量算错会导致读到半个字符。
 *    - 一定要校验魔数：这是"这个文件到底是不是我这个格式"的唯一快速判据。
 *    - 一定要做边界检查：畸形数据会让偏移越界，DataView 会抛 RangeError，
 *      解析器必须处理好这种异常，而不是崩溃。
 *    - 用 TextDecoder 解码名称时必须用 subarray 指定范围，否则会把后面的字节也解出来。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/09_binary_file_parsing.js
 *
 * 【预期输出】
 *   打印十六进制转储、逐字段解析结果、校验和验证，以及两类畸形数据的容错处理。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 常量：把格式规范写成代码，避免"魔法数字"散落各处
// ---------------------------------------------------------------------------

const HEADER_SIZE = 16; // 文件头固定 16 字节
const MAGIC = 'BDAT'; // 魔数
const VERSION = 1;

// 头部各字段的字节偏移（全部大端）
const H_MAGIC = 0; // 4 字节
const H_VERSION = 4; // 2 字节 uint16
const H_COUNT = 6; // 2 字节 uint16
const H_DATA_OFFSET = 8; // 4 字节 uint32
const H_CHECKSUM = 12; // 4 字节 uint32

// 记录内各字段的**相对**偏移（全部小端）
const R_TAG = 0; // 1 字节
const R_NAME_LEN = 1; // 2 字节 uint16
const R_NAME = 3; // nameLen 字节
const R_VALUE_EXTRA = 4; // 名称之后 4 字节 uint32
const R_FLAGS_EXTRA = 1; // 数值之后 1 字节

const TAG_INT = 0x01;
const TAG_TEXT = 0x02;

// 全局共用的编码器 / 解码器（构造一次即可复用）
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/**
 * 十六进制转储：像 hexdump 一样按行打印偏移、16 个字节、以及对应的 ASCII 字符。
 * 这是调试二进制数据最常用的手段。
 */
function hexdump(buffer, title) {
  const bytes = new Uint8Array(buffer);
  console.log(`\n  ${title}（共 ${bytes.length} 字节）`);
  console.log('  偏移   00 01 02 03 04 05 06 07  08 09 0a 0b 0c 0d 0e 0f   文本');
  console.log('  ' + '-'.repeat(70));
  for (let base = 0; base < bytes.length; base += 16) {
    // 本行要显示的字节（最后一行可能不足 16 个）
    const lineBytes = bytes.subarray(base, Math.min(base + 16, bytes.length));

    // 左半 8 字节与右半 8 字节分开显示，便于对齐观察
    const left = Array.from(lineBytes.subarray(0, 8), (b) => b.toString(16).padStart(2, '0')).join(' ');
    const right = Array.from(lineBytes.subarray(8, 16), (b) => b.toString(16).padStart(2, '0')).join(' ');

    // ASCII 一栏：可打印字符（0x20~0x7e）原样显示，其它显示为 '.'
    const ascii = Array.from(lineBytes, (b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.')).join('');

    console.log(
      `  ${base.toString(16).padStart(4, '0')}   ${left.padEnd(23)}  ${right.padEnd(23)}  ${ascii}`,
    );
  }
}

// ---------------------------------------------------------------------------
// 第一步：把 JS 对象写成二进制（序列化）
// ---------------------------------------------------------------------------

/**
 * 根据记录数组构造一个完整的 BDAT 缓冲区。
 * @param {{tag:number, name:string, value:number, flags:number}[]} records
 * @returns {ArrayBuffer}
 */
function writeBdat(records) {
  // 1) 预先编码每个名称，并算出每条记录的总长度。
  //    必须先算总长，才能一次性分配正好大小的 ArrayBuffer。
  const prepared = records.map((r) => {
    const nameBytes = encoder.encode(r.name);
    // 记录长度 = tag(1) + nameLen(2) + name(nameBytes.length) + value(4) + flags(1)
    const size = 1 + 2 + nameBytes.length + 4 + 1;
    return { ...r, nameBytes, size };
  });

  const totalSize = HEADER_SIZE + prepared.reduce((sum, r) => sum + r.size, 0);

  // 2) 一次性分配内存。
  const buffer = new ArrayBuffer(totalSize);
  const dv = new DataView(buffer); // 用来读写多字节整数
  const bytes = new Uint8Array(buffer); // 用来整块拷贝字节（如魔数、名称）

  // 3) 写文件头（大端序）。
  //    魔数是 4 个 ASCII 字符，直接按字节拷贝进去。
  const magicBytes = encoder.encode(MAGIC);
  bytes.set(magicBytes, H_MAGIC);
  dv.setUint16(H_VERSION, VERSION, false); // false = 大端
  dv.setUint16(H_COUNT, prepared.length, false);
  dv.setUint32(H_DATA_OFFSET, HEADER_SIZE, false);

  // 4) 写记录体（小端序），同时累计校验和。
  let cursor = HEADER_SIZE; // 游标：当前写到第几个字节
  let checksum = 0;

  for (const r of prepared) {
    // tag：1 字节
    dv.setUint8(cursor + R_TAG, r.tag);
    // nameLen：2 字节小端（true = 小端，与头部相反，制造"混合字节序"的真实场景）
    dv.setUint16(cursor + R_NAME_LEN, r.nameBytes.length, true);
    // name：变长，按字节整块拷贝
    bytes.set(r.nameBytes, cursor + R_NAME);
    // value：名称之后 4 字节小端
    dv.setUint32(cursor + R_NAME + r.nameBytes.length, r.value, true);
    // flags：最后 1 字节
    dv.setUint8(cursor + R_NAME + r.nameBytes.length + R_VALUE_EXTRA, r.flags);

    // 校验和：把每个 value 累加，用 >>> 0 保证按 32 位无符号回绕
    checksum = (checksum + r.value) >>> 0;

    // 游标前进这条记录的长度
    cursor += r.size;
  }

  // 5) 回填校验和（校验和字段在所有记录写完之后才算得出来）。
  dv.setUint32(H_CHECKSUM, checksum, false);

  return buffer;
}

// ---------------------------------------------------------------------------
// 第二步：把二进制读回 JS 对象（反序列化）
// ---------------------------------------------------------------------------

/**
 * 解析一个 BDAT 缓冲区。
 * @param {ArrayBuffer} buffer
 * @returns {{header: object, records: object[]}}
 */
function parseBdat(buffer) {
  const dv = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 0) 最小长度检查：连头部都装不下就不用往下走了。
  if (bytes.length < HEADER_SIZE) {
    throw new Error(`数据太短：至少需要 ${HEADER_SIZE} 字节，实际只有 ${bytes.length} 字节`);
  }

  // 1) 读魔数：头 4 字节按 UTF-8 解码。
  //    这里用 subarray 明确限定范围，否则会把整个文件的字节都解出来。
  const magic = decoder.decode(bytes.subarray(H_MAGIC, H_MAGIC + 4));
  if (magic !== MAGIC) {
    throw new Error(`魔数不匹配：期望 "${MAGIC}"，实际读到 "${magic}"`);
  }

  // 2) 读头部各项（大端）。
  const header = {
    magic,
    version: dv.getUint16(H_VERSION, false),
    recordCount: dv.getUint16(H_COUNT, false),
    dataOffset: dv.getUint32(H_DATA_OFFSET, false),
    checksum: dv.getUint32(H_CHECKSUM, false),
  };

  if (header.version !== VERSION) {
    throw new Error(`不支持的版本号：${header.version}`);
  }

  // 3) 从数据区起始位置开始，逐条读出记录。
  const records = [];
  let cursor = header.dataOffset; // 游标 = 绝对字节偏移

  for (let i = 0; i < header.recordCount; i += 1) {
    // 每次循环先检查"能不能容下这条记录的最小长度（8 字节）"，
    // 这就是防畸形数据的边界检查。
    if (cursor + 8 > bytes.length) {
      throw new Error(`第 ${i + 1} 条记录越界：起始偏移 ${cursor}，总长 ${bytes.length}`);
    }

    // 字段 1：tag（1 字节，单字节无字节序问题）
    const tag = dv.getUint8(cursor + R_TAG);

    // 字段 2：nameLen（2 字节小端）
    const nameLen = dv.getUint16(cursor + R_NAME_LEN, true);

    // 变长字段之前必须再校验一次边界
    const recordEnd = cursor + 8 + nameLen;
    if (recordEnd > bytes.length) {
      throw new Error(`第 ${i + 1} 条记录的名称越界：需要到 ${recordEnd}，总长 ${bytes.length}`);
    }

    // 字段 3：name（UTF-8，长度为 nameLen 字节）
    //   subarray(start, end) 返回共享内存的子视图，然后交给 TextDecoder 解码。
    const name = decoder.decode(bytes.subarray(cursor + R_NAME, cursor + R_NAME + nameLen));

    // 字段 4：value（4 字节小端），紧跟在名称之后
    const valueOffset = cursor + R_NAME + nameLen;
    const value = dv.getUint32(valueOffset, true);

    // 字段 5：flags（1 字节）
    const flags = dv.getUint8(valueOffset + R_VALUE_EXTRA);

    records.push({
      index: i,
      offset: cursor, // 记录起始的绝对偏移，便于和 hexdump 对照
      size: recordEnd - cursor,
      tag,
      tagName: tag === TAG_INT ? 'INT' : tag === TAG_TEXT ? 'TEXT' : 'UNKNOWN',
      name,
      value,
      flags,
      active: (flags & 0b0000_0001) === 1, // 取最低位作为"是否激活"
    });

    // 游标前进到这条记录的末尾
    cursor = recordEnd;
  }

  // 4) 如果还有剩余字节，说明数据比声明的多（可能是追加数据或格式错误）。
  const trailing = bytes.length - cursor;

  return { header, records, trailing };
}

// ---------------------------------------------------------------------------
// 第三步：使用它
// ---------------------------------------------------------------------------

console.log('--- 1. 准备要写入的数据 ---');

// 字段含义：tag 记录类型；name 名称；value 数值；flags 标志位。
const sourceRecords = [
  { tag: TAG_INT, name: 'score', value: 9527, flags: 0b0000_0001 },
  { tag: TAG_INT, name: 'level', value: 42, flags: 0b0000_0000 },
  { tag: TAG_TEXT, name: '标题', value: 2024, flags: 0b0000_0001 },
  { tag: TAG_TEXT, name: 'description', value: 123456, flags: 0b0000_0011 },
];

console.log('共', sourceRecords.length, '条记录：');
for (const r of sourceRecords) {
  // 名称的字节长度决定记录有多长，中英文差别很大（"标题" 2 字 = 6 字节）。
  const nameBytes = encoder.encode(r.name).length;
  console.log(
    `  ${r.name.padEnd(12)} 名称 ${nameBytes} 字节 -> 记录长 ${8 + nameBytes} 字节`,
  );
}

console.log('--- 2. 序列化成二进制 ---');

const fileBuffer = writeBdat(sourceRecords);

// 预期总长 = 16（头部）+ Σ(8 + 名称字节数)
const expectedSize =
  HEADER_SIZE + sourceRecords.reduce((sum, r) => sum + 8 + encoder.encode(r.name).length, 0);
console.log('实际缓冲区大小 =', fileBuffer.byteLength, '字节，预期 =', expectedSize, '字节');

hexdump(fileBuffer, 'BDAT 文件内容');

console.log('\n  读法提示（对照第 0000 行）：');
console.log('    偏移 0  的 42 44 41 54        = "BDAT" 魔数');
console.log('    偏移 4  的 00 01              = 版本号 1（大端：高位在前，所以是 0x0001）');
console.log('    偏移 6  的 00 04              = 记录条数 4（大端）');
console.log('    偏移 8  的 00 00 00 10        = 数据区偏移 16（大端）');
console.log('    偏移 12 的 00 02 0f 89        = 校验和（大端）= 135049');
console.log('    偏移 16 起                    = 第 1 条记录：01(INT) 05 00(名称长 5，小端) 73 63 6f 72 65("score") 37 25 00 00(值 9527，小端) 01(标志)');

console.log('--- 3. 反序列化：逐字段解析回来 ---');

const parsed = parseBdat(fileBuffer);

console.log('解析出的文件头：');
console.log('  魔数        =', parsed.header.magic);
console.log('  版本        =', parsed.header.version);
console.log('  记录条数    =', parsed.header.recordCount);
console.log('  数据区偏移  =', parsed.header.dataOffset, '（正好跳过 16 字节的头部）');
console.log('  校验和      =', parsed.header.checksum);

console.log('\n解析出的记录：');
console.log('  #  起始偏移  长度  tag    名称          数值      标志  激活');
for (const r of parsed.records) {
  console.log(
    `  ${String(r.index).padEnd(2)} ${String(r.offset).padEnd(9)} ${String(r.size).padEnd(5)} ` +
      `${r.tagName.padEnd(6)} ${r.name.padEnd(12)} ${String(r.value).padEnd(8)} ` +
      `${'0b' + r.flags.toString(2).padStart(4, '0')}  ${r.active ? '是' : '否'}`,
  );
}
console.log('剩余未解析字节 =', parsed.trailing, '（0 表示数据正好用完）');

console.log('--- 4. 校验和验证 ---');

// 重新计算一遍，和头部里存的比对 —— 这是检测数据损坏最廉价的手段。
const recomputed = parsed.records.reduce((sum, r) => (sum + r.value) >>> 0, 0);
console.log('重新计算的校验和 =', recomputed);
console.log('头部中存储的     =', parsed.header.checksum);
console.log('一致吗？         =', recomputed === parsed.header.checksum);

// 改一个数值，校验和就对不上了 —— 这正是它存在的意义。
const corrupted = fileBuffer.slice(0); // 复制一份，不动原件
const corruptedView = new DataView(corrupted);
corruptedView.setUint32(16 + 8, 1, true); // 第一条记录的 value（16 + 3 + 5 = 24 偏移）
const reparsed = parseBdat(corrupted);
const rehash = reparsed.records.reduce((sum, r) => (sum + r.value) >>> 0, 0);
console.log('篡改一个 value 后：重算 =', rehash, ', 头部存的 =', reparsed.header.checksum);
console.log('  一致吗？', rehash === reparsed.header.checksum, ' <- 校验和能发现数据被改动');

console.log('--- 5. 混合字节序的验证：故意用错会怎样 ---');

// 头部是**大端**写的。如果按小端去读版本号 1（字节 00 01），会读成 256。
console.log('版本号按大端读 =', fileBuffer && new DataView(fileBuffer).getUint16(H_VERSION, false));
console.log('版本号按小端读 =', new DataView(fileBuffer).getUint16(H_VERSION, true), '（错误解读）');

// 记录里的 value 是**小端**写的。按大端读一个小数字就会变成天文数字。
const firstValueLE = new DataView(fileBuffer).getUint32(16 + 8, true);
const firstValueBE = new DataView(fileBuffer).getUint32(16 + 8, false);
console.log('第一条 value 按小端读 =', firstValueLE, '（正确，9527）');
console.log('第一条 value 按大端读 =', firstValueBE, '（错误解读）');

console.log('--- 6. 容错：畸形数据必须被拒绝 ---');

// 场景 A：魔数被破坏（把第一个字节 B 改成 X）。
const badMagic = fileBuffer.slice(0);
new Uint8Array(badMagic)[0] = 0x58; // 'X'
try {
  parseBdat(badMagic);
} catch (err) {
  console.log('A. 魔数错误：', err.constructor.name, '-', err.message);
}

// 场景 B：数据被截断（只留前 20 字节，第一条记录的名称都放不下）。
try {
  parseBdat(fileBuffer.slice(0, 20));
} catch (err) {
  console.log('B. 数据截断：', err.constructor.name, '-', err.message);
}

// 场景 C：完全不是这个格式的数据（纯随机字节）。
try {
  parseBdat(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]).buffer);
} catch (err) {
  console.log('C. 非本格式：', err.constructor.name, '-', err.message);
}
console.log('  -> 真实解析器必须像这样"先验魔数、再做边界检查"，绝不假设输入是合法的');

console.log('--- 7. 追加一条记录：演示"变长格式必须重算长度" ---');

// 在原有记录后追加一条，需要重新计算总长与校验和 —— 直接重新序列化最简单。
const extended = writeBdat([...sourceRecords, { tag: TAG_TEXT, name: '作者', value: 7, flags: 0b0000_0001 }]);
const extendedParsed = parseBdat(extended);
console.log('追加后缓冲区大小 =', extended.byteLength, '（原', fileBuffer.byteLength, '字节）');
console.log('记录条数         =', extendedParsed.header.recordCount);
console.log('最后一条记录     =', JSON.stringify(extendedParsed.records.at(-1)));
console.log('  -> 名称从 "description"(11 字节) 变成 "作者"(6 字节)，记录长度随之变化');
console.log('  -> 二进制格式里"变长"就意味着：写完之前无法知道总大小，必须两遍扫描或动态扩容');

console.log('\n全部演示完毕。');
