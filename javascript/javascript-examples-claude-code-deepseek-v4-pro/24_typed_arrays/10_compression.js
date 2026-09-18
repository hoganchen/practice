/**
 * ============================================================================
 * 知识点：二进制压缩 —— CompressionStream / DecompressionStream 与 node:zlib
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/01_arraybuffer_basics.js、24_typed_arrays/06_textencoder_decoder.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    压缩 = 用更少的字节表示同样的信息。它不是"加密"，也不是"编码"：
 *      - 编码（Base64 / Hex）是**无损的体积膨胀**，只为了换成安全字符集；
 *      - 加密是**可逆的保密变换**，体积基本不变；
 *      - 压缩是**可逆的体积缩减**，靠的是消除数据里的重复与冗余。
 *    本文件讲的三个压缩格式都属于 DEFLATE 家族：
 *      - deflate-raw：最裸的 DEFLATE 数据流，没有任何头部和校验。
 *      - deflate（zlib 格式）：DEFLATE 流 + 2 字节头 + 4 字节 Adler-32 校验。
 *      - gzip：DEFLATE 流 + 10 字节头（含魔数 0x1f 0x8b）+ 8 字节尾
 *              （CRC-32 + 原始长度）。最适合存文件 / 走 HTTP。
 *    它们输出的字节流**完全一样地"解压后还原"**，区别只在"套了几层壳"。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 日志与快照：一天几 GB 的访问日志，压缩后落盘能省 80%~95% 的空间。
 *    - 大 JSON 传输：接口返回 5 MB 的 JSON，gzip 后往往只剩几百 KB，
 *      移动端弱网下这就是"能打开"和"打不开"的区别。
 *    - HTTP：浏览器与服务器之间用 `Content-Encoding: gzip` 协商压缩，
 *      请求头里的 `Accept-Encoding` 就是干这个的。
 *    - 容器与镜像：Docker 层、npm 包（.tgz）、JAR 全是压缩归档。
 *    - 数据库与列存：列式存储大量使用字典编码 + 压缩。
 *    一句话：**只要字节要经过网络或磁盘，就应该先问一句"能不能压"。**
 *
 * 3. 核心语法要点
 *    - Web 标准（Node 18+ / 所有现代浏览器都有）：
 *        const cs = new CompressionStream('gzip');     // 'gzip' | 'deflate' | 'deflate-raw'
 *        const ds = new DecompressionStream('gzip');
 *      它们都是**转换流（TransformStream）**，用法是把它接进管道：
 *        sourceStream.pipeThrough(cs) -> 压缩后的字节流
 *      在 Node 里把 ReadableStream 变成 Uint8Array 最省事的写法：
 *        new Uint8Array(await new Response(stream).arrayBuffer())
 *    - Node 专有：`node:zlib` 提供 gzipSync / gunzipSync / deflateSync /
 *      inflateSync / deflateRawSync / inflateRawSync 等一次性（同步）API，
 *      以及 createGzip 等流式 API。
 *    - 两者**输出格式完全互通**：CompressionStream 压出来的 gzip，
 *      zlib.gunzipSync 能解；zlib.gzipSync 压出来的，DecompressionStream 也能解。
 *      因为底层都是 zlib 的 DEFLATE 实现。
 *    - 压缩级别：Web 的 CompressionStream **没有级别参数**（固定用 zlib 默认级别 6）；
 *      要精细控制级别（0~9）只能用 node:zlib 的 `{ level: 9 }`。
 *
 * 4. 常见陷阱
 *    - 把压缩当成加密：gzip 数据任何人都能解开，敏感信息必须先加密再压缩。
 *    - 误以为"压缩过的数据再压一定没有收益"，或者反过来"多压几遍总能更小"。
 *      正确的判据是**熵（可预测性）**而不是"压过没有"：对高熵内容
 *      （JPEG / PNG / MP4 / ZIP）再压只会膨胀；但对**低熵源**的 gzip 输出
 *      再压，往往还能再省一大截（见第 8 节的反直觉实证）。
 *      反复压缩最终会到达"不动点"，之后每轮固定多出约 23 字节的外壳开销。
 *    - 忘记流是**异步且一次性**的：pipeThrough 之后原流就被消费掉了，不能再读第二次。
 *    - 解压损坏数据的报错发生在**流内部**，会以 rejected promise 的形式冒出来，
 *      必须 try/catch，否则变成 unhandled rejection。
 *    - 解压"压缩炸弹"：几 KB 的 gzip 能解出几 GB，服务端必须先校验原始长度上限。
 *    - 小数据别压：几十字节的内容压完可能更大（gzip 光固定头尾就 18 字节）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/10_compression.js
 *
 * 【预期输出】
 *   打印 Web 压缩流的往返验证、三种格式的头字节对比、分块流式压缩、
 *   与 node:zlib 的互通验证、不同数据的压缩率对比，
 *   以及"反复压缩直到不动点"的完整实证链。
 *   压缩后的字节长度因 zlib 版本而异，因此本文件只断言"结构关系"
 *   （如往返还原、压缩后小于原始、触底后每轮增量是常数），不断言精确字节数。
 * ============================================================================
 */

import { randomBytes as nodeRandomBytes } from 'node:crypto';
import { gzipSync, gunzipSync, deflateSync, inflateSync, deflateRawSync, inflateRawSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// 0. 环境能力检测
// ---------------------------------------------------------------------------

// CompressionStream / DecompressionStream 是 Web 标准，Node 18+ 作为全局对象提供。
// 浏览器、Deno、Bun、Cloudflare Workers 也都有，是真正的"跨运行时"API。
const HAS_COMPRESSION_STREAM = typeof CompressionStream === 'function';
const HAS_DECOMPRESSION_STREAM = typeof DecompressionStream === 'function';
const WEB_COMPRESSION_OK = HAS_COMPRESSION_STREAM && HAS_DECOMPRESSION_STREAM;

// node:zlib 是 Node 内置模块，一定存在，无需检测。
// 它在浏览器里不可用 —— 这是 Node 与浏览器少数不通用之处。

// ---------------------------------------------------------------------------
// 1. 通用工具函数
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 把字节数组转成十六进制字符串（最多显示 max 个字节） */
function hex(bytes, max = 16) {
  const shown = Array.from(bytes.subarray(0, Math.min(max, bytes.length)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join(' ');
  return bytes.length > max ? `${shown} ...` : shown;
}

/** 逐字节比较两个 Uint8Array 是否完全相同 */
function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** 打印一行压缩率报告：原始 N 字节 -> 压缩后 M 字节，压缩率 X% */
function reportRatio(label, originalLen, compressedLen) {
  const ratio = (compressedLen / originalLen) * 100;
  const saved = 100 - ratio;
  const trend = saved >= 0 ? `节省 ${saved.toFixed(1)}%` : `反而增大 ${(-saved).toFixed(1)}%`;
  console.log(`  ${label}`);
  console.log(
    `    原始 ${originalLen} 字节 -> 压缩后 ${compressedLen} 字节，压缩率 ${ratio.toFixed(1)}%，${trend}`,
  );
  return ratio;
}

// 全局的检查计数：全部演示结束后打印统计。
let checkPass = 0;
let checkFail = 0;

/**
 * 做一次"稳定结论"检查。
 * 注意：这里只打印不抛错，保证脚本始终以退出码 0 结束 —— 这是本仓库的约定。
 * 只对**不依赖 zlib 版本**的结论做检查（往返还原、大小关系、魔数等）。
 */
function check(label, condition) {
  if (condition) {
    checkPass += 1;
    console.log(`  [通过] ${label}`);
  } else {
    checkFail += 1;
    console.log(`  [未通过] ${label}`);
  }
}

// ---------------------------------------------------------------------------
// 2. Web 压缩流：把 TransformStream 接进管道
// ---------------------------------------------------------------------------

/**
 * 用 CompressionStream 压缩一段字节。
 *
 * 拆解一下这一行都发生了什么：
 *   new Blob([bytes])             —— 把字节包装成一个 Blob（二进制大对象）
 *   .stream()                     —— 得到可读流 ReadableStream<Uint8Array>
 *   .pipeThrough(new CompressionStream(fmt))
 *                                 —— 把它接入压缩转换流，返回**压缩后**的可读流
 *   new Response(stream)          —— 用 Response 包住流，Response 会开始消费它
 *   .arrayBuffer()                —— 把整条流读干，拿到 ArrayBuffer
 *
 * 为什么用 Response 而不是手写 reader 循环？因为 Response 帮我们处理了
 * 背压（backpressure）和分片拼接，这是 Node 18+ / 浏览器通用的最短写法。
 */
async function webCompress(bytes, format = 'gzip') {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** 用 DecompressionStream 解压（格式必须与压缩时一致） */
async function webDecompress(bytes, format = 'gzip') {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * 演示"分块写入"：压缩流是**流式**的，可以边产生数据边压缩，
 * 不需要先在内存里攒出完整输入 —— 这正是压缩大文件/大响应的正确姿势。
 *
 * 关键点：写入（writer.write）与读取（Response 读流）必须**并发**进行。
 * 如果先把所有块写完再开始读，遇到背压时写会一直等待、读又还没开始，
 * 就会直接死锁。所以这里先启动读取，再循环写入。
 */
async function webCompressInChunks(bytes, chunkSize, format = 'gzip') {
  const cs = new CompressionStream(format);
  const writer = cs.writable.getWriter();

  // 先启动读取（不 await），让下游先转起来，避免背压死锁。
  const reading = new Response(cs.readable).arrayBuffer();

  // 再一块一块地喂进去。
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    await writer.write(bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  await writer.close(); // 关闭写入端，告诉压缩流"输入结束"

  return new Uint8Array(await reading);
}

// ---------------------------------------------------------------------------
// 3. 样本数据：准备"压得动"和"压不动"两类
// ---------------------------------------------------------------------------

/** 造一份高重复度的日志文本（模拟真实的 JSON 行日志） */
function buildLogText(lines) {
  const out = [];
  for (let i = 0; i < lines; i++) {
    const level = i % 20 === 0 ? 'ERROR' : 'INFO';
    out.push(
      JSON.stringify({
        ts: `2026-09-16T10:${String(i % 60).padStart(2, '0')}:00.000Z`,
        level,
        service: 'order-service',
        // 故意重复的字段：真实日志里这种样板字段占比极高，正是压缩的用武之地
        traceId: `trace-0000-${i % 1000}`,
        message: level === 'ERROR' ? 'payment gateway timeout' : 'order created successfully',
        durationMs: 12 + (i % 7),
      }),
    );
  }
  return out.join('\n');
}

// ---------------------------------------------------------------------------
// 4. 主流程
// ---------------------------------------------------------------------------

async function main() {
  console.log('================ 二进制压缩：从 Web 流到 node:zlib ================\n');

  // -------------------------------------------------------------------------
  console.log('--- 1. 环境能力检测 ---');
  // -------------------------------------------------------------------------
  console.log(`  CompressionStream        : ${HAS_COMPRESSION_STREAM ? '可用' : '不可用'}`);
  console.log(`  DecompressionStream      : ${HAS_DECOMPRESSION_STREAM ? '可用' : '不可用'}`);
  console.log('  node:zlib（gzipSync 等）  : 可用（Node 内置模块，浏览器中不可用）');
  console.log(`  当前 Node 版本           : ${process.version}`);
  if (!WEB_COMPRESSION_OK) {
    console.log('  说明：本环境缺少 Web 压缩流，第 2~5 节将跳过，仅演示 node:zlib 部分。');
    console.log('       降级方案：全部改用 node:zlib 的 gzipSync / gunzipSync。');
  }

  // -------------------------------------------------------------------------
  console.log('\n--- 2. 原始数据长什么样 ---');
  // -------------------------------------------------------------------------
  const logText = buildLogText(2000);
  const logBytes = encoder.encode(logText);
  // 密码学安全的随机字节：完全无法压缩的"最坏情况"样本
  const randomData = new Uint8Array(nodeRandomBytes(64 * 1024));
  // Base64 文本：字符集只有 64 种，比随机字节好压，但远不如自然语言
  const base64Text = Buffer.from(nodeRandomBytes(48 * 1024)).toString('base64');
  const base64Bytes = encoder.encode(base64Text);

  console.log(`  日志文本（高重复 JSON 行）: ${logBytes.length} 字节`);
  console.log(`    UTF-8 前 48 字节: ${hex(logBytes, 48)}`);
  console.log(`    文本开头: ${logText.slice(0, 72)}...`);
  console.log(`  随机字节（不可压缩样本）  : ${randomData.length} 字节`);
  console.log(`    前 16 字节: ${hex(randomData)}`);
  console.log(`  Base64 文本（中等可压）    : ${base64Bytes.length} 字节`);
  console.log(`    前 48 字节: ${hex(base64Bytes, 48)}`);

  // -------------------------------------------------------------------------
  console.log('\n--- 3. CompressionStream 基础用法与往返验证 ---');
  // -------------------------------------------------------------------------
  if (WEB_COMPRESSION_OK) {
    const gz = await webCompress(logBytes, 'gzip');
    console.log(`  压缩后 ${gz.length} 字节，前 16 字节: ${hex(gz, 16)}`);
    console.log('  注意前两个字节 1f 8b —— 这就是 gzip 的魔数（RFC 1952 规定）。');

    // 往返验证：压缩再解压，必须**逐字节**完全还原，这是唯一可靠的正确性判据。
    const roundTrip = await webDecompress(gz, 'gzip');
    check('gzip 往返后逐字节还原', bytesEqual(roundTrip, logBytes));
    check('gzip 输出以 1f 8b 开头（gzip 魔数）', gz[0] === 0x1f && gz[1] === 0x8b);
    check('往返后的文本与原文一致', decoder.decode(roundTrip) === logText);
    reportRatio('高重复日志文本 gzip', logBytes.length, gz.length);
  } else {
    console.log('  （跳过：本环境不支持 CompressionStream）');
  }

  // -------------------------------------------------------------------------
  console.log('\n--- 4. 三种格式对比：gzip / deflate / deflate-raw ---');
  // -------------------------------------------------------------------------
  const body = encoder.encode('ABCD'.repeat(3000)); // 'ABCD' 重复 3000 次，极易压缩
  console.log(`  统一使用样本: "${'ABCD'.repeat(6)}..." 共 ${body.length} 字节`);

  const zlibVariants = [
    ['deflate-raw（裸 DEFLATE，无头无校验）', deflateRawSync(body), inflateRawSync],
    ['deflate（zlib 格式，2 字节头 + Adler-32）', deflateSync(body), inflateSync],
    ['gzip（10 字节头 + CRC-32 尾）', gzipSync(body), gunzipSync],
  ];

  for (const [name, compressed, decompress] of zlibVariants) {
    const restored = decompress(compressed);
    console.log(`  ${name}`);
    console.log(
      `    长度 ${compressed.length} 字节，前 4 字节 ${hex(compressed, 4)}，解压还原 ${bytesEqual(restored, body) ? '成功' : '失败'}`,
    );
  }
  console.log('  观察要点：');
  console.log('    - 三者压缩后的**长度几乎一样**，因为核心 DEFLATE 数据是同一份；');
  console.log('      差的那十几到二十字节，全是各自的"外壳"（头部 + 校验尾）。');
  console.log('    - 解压时必须告诉解压器"这是哪种壳"，格式选错会直接报错。');
  console.log('    - gzip 的壳最厚但自带 CRC-32 校验，适合存文件（能发现损坏）；');
  console.log('      deflate-raw 最省字节，适合双方已约定格式的内部协议。');

  if (WEB_COMPRESSION_OK) {
    const webGz = await webCompress(body, 'gzip');
    const webDfl = await webCompress(body, 'deflate');
    const webRaw = await webCompress(body, 'deflate-raw');
    console.log('\n  Web CompressionStream 生成的三份结果：');
    console.log(`    gzip        ${String(webGz.length).padStart(6)} 字节  头 ${hex(webGz, 2)}`);
    console.log(`    deflate     ${String(webDfl.length).padStart(6)} 字节  头 ${hex(webDfl, 2)}`);
    console.log(`    deflate-raw ${String(webRaw.length).padStart(6)} 字节  头 ${hex(webRaw, 2)}`);
    console.log('    deflate 的 78 9c 是 zlib 头（0x78 = CMF，0x9c = 默认级别 6 的 FLG）。');
    console.log('    同一个 gzip 样本，Web 流与 zlib 都生成 1f 8b 开头，格式完全兼容。');
  }

  // -------------------------------------------------------------------------
  console.log('\n--- 5. 流式管道：分块喂数据，边读边压 ---');
  // -------------------------------------------------------------------------
  if (WEB_COMPRESSION_OK) {
    const whole = await webCompress(logBytes, 'gzip');
    const chunked = await webCompressInChunks(logBytes, 4096, 'gzip');
    console.log(`  一次性压缩      : ${whole.length} 字节`);
    console.log(`  按 4096 字节分块: ${chunked.length} 字节（共 ${Math.ceil(logBytes.length / 4096)} 块）`);
    const restored = await webDecompress(chunked, 'gzip');
    check('分块写入的流压缩结果能完整还原', bytesEqual(restored, logBytes));
    console.log('  结论：压缩流是**有状态**的，块边界不会影响最终结果。');
    console.log('  这就是为什么压缩大文件时不需要先把整个文件读进内存 ——');
    console.log('  文件读流 -> pipeThrough(CompressionStream) -> 写流，内存占用恒定。');

    // 流一旦被消费就不能再读第二次，这是最容易踩的坑之一。
    const oneShot = new Blob([logBytes]).stream().pipeThrough(new CompressionStream('gzip'));
    await new Response(oneShot).arrayBuffer(); // 第一次读：OK
    console.log('  提示：ReadableStream 是一次性的，上面的流已被消费，无法再读第二次。');
  } else {
    console.log('  （跳过：本环境不支持 CompressionStream）');
  }

  // -------------------------------------------------------------------------
  console.log('\n--- 6. 与 node:zlib 的互通验证 ---');
  // -------------------------------------------------------------------------
  const zlibGz = gzipSync(logBytes);
  console.log(`  zlib.gzipSync        : ${zlibGz.length} 字节，头 ${hex(zlibGz, 2)}`);
  check('zlib.gunzipSync 能解开 zlib 自己的 gzip', bytesEqual(gunzipSync(zlibGz), logBytes));

  if (WEB_COMPRESSION_OK) {
    const webGz = await webCompress(logBytes, 'gzip');
    console.log(`  CompressionStream    : ${webGz.length} 字节，头 ${hex(webGz, 2)}`);

    // 关键结论：两条路生成的字节流互相可解，因为底层是同一个 zlib。
    check('node:zlib 能解开 CompressionStream 的输出', bytesEqual(gunzipSync(webGz), logBytes));
    const webDecodedZlib = await webDecompress(zlibGz, 'gzip');
    check('DecompressionStream 能解开 node:zlib 的输出', bytesEqual(webDecodedZlib, logBytes));
    console.log('  两者的字节长度可能不同（默认级别/实现细节），但**格式互相兼容**，');
    console.log('  所以"浏览器压缩、服务端 Node 解压"是完全可行的组合。');
  }

  console.log('\n  压缩级别：Web CompressionStream 没有级别参数；node:zlib 有。');
  const level0 = gzipSync(logBytes, { level: 0 }); // 0 = 不压缩，只套壳
  const level6 = gzipSync(logBytes, { level: 6 }); // 默认级别
  const level9 = gzipSync(logBytes, { level: 9 }); // 最大压缩
  console.log(`    level 0（不压缩，仅套壳）: ${level0.length} 字节`);
  console.log(`    level 6（默认）          : ${level6.length} 字节`);
  console.log(`    level 9（最高）          : ${level9.length} 字节`);
  check('level 0 比 level 9 大得多（0 级只是套壳不压缩）', level0.length > level9.length);
  console.log('    level 0 比原始数据还大 —— 这就是"套壳开销"的直接证据。');
  check('level 0 输出大于原始数据（纯头部开销）', level0.length > logBytes.length);

  // -------------------------------------------------------------------------
  console.log('\n--- 7. 什么压得动，什么压不动 ---');
  // -------------------------------------------------------------------------
  const samples = [
    ['高度重复（"ABCD" x 3000）', body],
    ['高重复 JSON 日志', logBytes],
    ['Base64 文本（64 个字符集）', base64Bytes],
    ['纯随机字节（信息熵最高）', randomData],
  ];

  const results = [];
  for (const [name, bytes] of samples) {
    const gz = gzipSync(bytes);
    const ratio = reportRatio(name, bytes.length, gz.length);
    results.push({ name, ratio });
  }

  console.log('\n  规律总结：');
  console.log('    - 压缩算法找的是**重复模式**。重复越多，压得越狠。');
  console.log('    - 随机字节没有模式，理论上不可压缩，压完只会略微变大（多出头部开销）。');
  console.log('    - Base64 只用 64 个字符（每字符 6 比特），本身就有 33% 的冗余，');
  console.log('      所以能被压回去一部分 —— 这也是"Base64 和压缩是两回事"的好例子。');
  check('重复数据能被压缩（压缩率 < 100%）', results[0].ratio < 100);
  check('随机字节几乎压不动（压缩率 >= 100%）', results[3].ratio >= 100);

  // -------------------------------------------------------------------------
  console.log('\n--- 8. "已压缩的数据再压没有意义"，这句话只对了一半 ---');
  // -------------------------------------------------------------------------

  // 情况 A：真正的"已压缩数据" —— 内容已经是高熵的，再压立刻膨胀。
  console.log('  [A] 高熵数据（等价于 JPEG / PNG / MP4 / ZIP 内部的内容）');
  const onceRandom = gzipSync(randomData);
  const twiceRandom = gzipSync(onceRandom);
  console.log(`    原始随机字节        : ${randomData.length} 字节`);
  console.log(`    第 1 次 gzip        : ${onceRandom.length} 字节  <- 已经变大`);
  console.log(`    第 2 次 gzip        : ${twiceRandom.length} 字节  <- 继续变大`);
  check('高熵数据第 1 次压缩就膨胀', onceRandom.length > randomData.length);
  check('高熵数据第 2 次压缩继续膨胀', twiceRandom.length > onceRandom.length);
  console.log('    结论：对一个"内容本身就不可预测"的数据再压缩，纯属浪费 CPU。');
  console.log('    现实中的同类：JPEG / PNG / MP3 / MP4 / ZIP / .tgz / .jar / .docx。');

  // 情况 B：反直觉的真相 —— 对**低熵源**的 gzip 输出再 gzip，还能再压一轮！
  //         因为 gzip 是**通用**压缩器，第一遍输出的字节流本身仍残留可压结构
  //         （重复的 Huffman 表、重复的匹配距离编码等）。
  console.log('\n  [B] 反直觉：对"低熵源"的 gzip 输出再压，居然还能大幅缩小');
  // 每一轮的"输入"都是上一轮的输出，一共迭代 12 次，观察整条收敛曲线。
  const chain = [logBytes.length];
  let cursor = logBytes;
  for (let i = 0; i < 12; i++) {
    cursor = gzipSync(cursor);
    chain.push(cursor.length);
  }
  console.log(`    原始日志: ${chain[0]} 字节`);
  for (let i = 1; i < chain.length; i++) {
    const diff = chain[i] - chain[i - 1];
    const delta = i === 1 ? '（相对于原始数据）' : `（较上一轮 ${diff >= 0 ? '+' : ''}${diff} 字节）`;
    console.log(`    第 ${i} 次 gzip: ${String(chain[i]).padStart(7)} 字节 ${delta}`);
  }
  check('低熵源的 gzip 输出还能被再压一轮', chain[2] < chain[1]);
  check('反复压缩最终会触底', chain.some((v, i) => i > 0 && i < chain.length - 1 && v < chain[i - 1] && v < chain[i + 1]));
  console.log('    为什么会这样？因为"压缩过"不等于"高熵"。');
  console.log('    日志是极低熵的源，gzip 第一遍只消掉了最粗的重复，输出里');
  console.log('    仍然留着大量可预测结构，所以第二遍又省下了一大截。');

  // -------------------------------------------------------------------------
  console.log('\n--- 9. 迭代到"不动点"：什么才是真正的不可压缩 ---');
  // -------------------------------------------------------------------------
  // 把"反复压缩"一直做下去会怎样？答案是：会到达一个**不动点**，
  // 之后再压，每加一层 gzip 就固定多出十几到二十几字节的"纯外壳开销"。
  let minIdx = 0;
  for (let i = 0; i < chain.length; i++) {
    if (chain[i] < chain[minIdx]) minIdx = i;
  }
  console.log(`  上面那条链在第 ${minIdx} 次压缩后触底（${chain[minIdx]} 字节）`);
  console.log('  触底之后的变化：');
  let overheadSamples = [];
  for (let i = minIdx + 1; i < chain.length; i++) {
    const diff = chain[i] - chain[i - 1];
    overheadSamples.push(diff);
    console.log(`    第 ${i} 次: ${chain[i]} 字节，比上一次 +${diff} 字节`);
  }
  check('触底后每一轮都在变大', overheadSamples.every((d) => d > 0));
  // 只取最后几轮来看"常数性"：越靠后数据越接近高熵，外壳开销越纯粹。
  const tail = overheadSamples.slice(-5);
  check(
    '最后 5 轮的"每轮增量"趋于同一个常数（纯外壳开销）',
    tail.every((d) => Math.abs(d - tail[tail.length - 1]) <= 3),
  );
  const expectation = tail[tail.length - 1];
  console.log(`  这个趋于稳定的增量约 ${expectation} 字节，它的构成是固定的：`);
  console.log('    gzip 头 10 字节 + DEFLATE 存储块开销约 5 字节 + gzip 尾 8 字节 = 约 23 字节。');
  console.log('    （具体数值随 zlib 版本略有出入，这里只看"它是常数"这个结论。）');

  console.log('\n  所以正确的判据不是"这份数据压过没有"，而是"它还有没有可预测的结构"：');
  console.log('    - 想知道能不能压，最可靠的办法就是**试压一下看结果**；');
  console.log('    - 工程上通常先看 Content-Type / 扩展名，命中已知压缩格式就跳过；');
  console.log('    - 也可以只取前 64 KB 采样试压，根据压缩率决定整份数据压不压。');
  console.log('    - 反过来，"重复压缩榨干冗余"在实践中极少用：第 2 遍的收益');
  console.log('      远小于第 1 遍，而 CPU 与解压次数都翻了倍。');

  // -------------------------------------------------------------------------
  console.log('\n--- 10. 常见陷阱：解压损坏的数据 ---');
  // -------------------------------------------------------------------------
  const corrupt = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);

  // 陷阱一：用 zlib 解压垃圾数据，同步抛错。
  try {
    gunzipSync(corrupt);
    console.log('  （未抛错，说明当前 zlib 版本容错更宽松）');
  } catch (err) {
    console.log(`  zlib.gunzipSync(垃圾数据) 抛出: ${err.constructor.name} - ${err.message}`);
  }

  // 陷阱二：Web 压缩流的错误在**流内部**产生，以 rejected promise 的形式抛出。
  if (WEB_COMPRESSION_OK) {
    try {
      await webDecompress(corrupt, 'gzip');
      console.log('  （未抛错）');
    } catch (err) {
      const msg = err.message || '（该环境的流错误对象不带 message）';
      console.log(`  DecompressionStream(垃圾数据) 抛出: ${err.constructor.name} - ${msg}`);
      console.log('  注意：如果不 try/catch，这里会变成 unhandled rejection 并让进程崩溃。');
    }
  }

  // 陷阱三：截断的 gzip 数据（模拟网络传输中断）。
  const onceGz = gzipSync(logBytes);
  const truncated = onceGz.subarray(0, Math.floor(onceGz.length / 2));
  try {
    gunzipSync(truncated);
    console.log('  截断数据竟然解开了（不常见，说明前半段恰好构成了完整块）');
  } catch (err) {
    console.log(`  截断的 gzip 数据解压抛出: ${err.constructor.name} - ${err.message}`);
  }

  console.log('  防御手段：');
  console.log('    1. 永远 try/catch 包住解压，把"数据损坏"当成可预期的业务错误；');
  console.log('    2. 服务端先看数据里的原始长度字段，超过上限直接拒绝（防压缩炸弹）；');
  console.log('    3. 解压后校验长度/校验和/结构，不要盲目信任解出来的内容。');

  // -------------------------------------------------------------------------
  console.log('\n--- 11. 收尾统计 ---');
  // -------------------------------------------------------------------------
  console.log(`  稳定结论检查：通过 ${checkPass} 项，未通过 ${checkFail} 项`);
  console.log('  说明：本文件刻意不断言压缩后的精确字节数 ——');
  console.log('        它随 zlib 版本、压缩级别、运行时而变化，只断言结构关系才可靠。');
  console.log('\n全部演示完毕。');
}

// 顶层统一收口：任何未预期的异常都打印出来（便于排查），不让进程静默失败。
main().catch((err) => {
  console.error('示例执行失败:', err);
  process.exitCode = 1;
});
