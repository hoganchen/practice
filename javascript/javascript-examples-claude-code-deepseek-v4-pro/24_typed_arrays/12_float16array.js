/**
 * ============================================================================
 * 知识点：Float16Array 与半精度浮点（ES2025）—— 1+5+10 的表示、精度与内存取舍
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/03_typed_array_types.js、24_typed_arrays/02_dataview.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Float16Array 是定型数组家族在 ES2025 新增的成员（每个元素 2 字节）。
 *    本目录的 03_typed_array_types.js 把头文件写死为"**8 种**核心类型"，
 *    那份清单已经过时了 —— 加上 Uint8ClampedArray、BigInt64Array、BigUint64Array
 *    和本文件的 Float16Array，实际共有 12 种。本文件把缺的这一种补上。
 *
 *    半精度浮点（IEEE 754 binary16）把 16 位切成三段：
 *      1 位符号 + 5 位指数 + 10 位尾数
 *    对比一下三种精度：
 *      Float16  1 + 5  + 10 = 16 位  —— 约 3 位十进制有效数字，范围约 5.96e-8 ~ 65504
 *      Float32  1 + 8  + 23 = 32 位  —— 约 7 位十进制有效数字，范围约 1.2e-38 ~ 3.4e38
 *      Float64  1 + 11 + 52 = 64 位  —— 约 16 位十进制有效数字（= JS 的 number）
 *    指数位从 8 位砍到 5 位，是"范围急剧缩小"的根源：
 *      偏置 15，指数范围 1~30 -> 正规数 2^-14 ~ 2^15，再往下靠次正规数到 2^-24。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) **ML 推理**：模型权重与激活值动辄上亿个，float32 存一份就是几百 MB。
 *        换成 float16，内存与显存带宽直接减半，而推理精度损失通常可以忽略。
 *        （这就是"fp16 推理""半精度量化"背后的数据类型。）
 *    (2) **图形 / WebGPU**：GPU 的纹理与顶点数据大量用 half 类型，
 *        WebGPU 的 shader 里 f16 是一等公民，CPU 侧要与它对齐。
 *    (3) **HDR 与环境贴图**：half-float 纹理在图形学里是标准做法，
 *        因为它对"亮度范围大但精度要求低"的数据正好合适。
 *    (4) **带宽受限的传输**：移动端上传下载、WebSocket 推送向量数据时，
 *        半精度能把体积砍一半（对比 float32）。
 *    反过来说：**金额、坐标、ID、时间戳绝对不要用 float16** ——
 *    它的有效数字只有 3 位，整数超过 2048 就开始丢精度。
 *
 * 3. 核心语法要点
 *    (1) new Float16Array(length | array | buffer)   —— 与其它定型数组完全一致
 *        Float16Array.BYTES_PER_ELEMENT === 2
 *    (2) DataView.prototype.getFloat16(offset, littleEndian) / setFloat16(...)
 *        —— 按字节偏移读写单个半精度数，配合 ArrayBuffer 做协议解析
 *    (3) Math.f16round(x) —— 把任意数字**舍入**到最近的半精度可表示值，
 *        返回值仍是普通 number（不涉及存储）。这是看清精度损失的最好工具：
 *        Math.f16round(0.1) === 0.0999755859375
 *    (4) 三者共享同一套舍入规则：roundTiesToEven（就近舍入，正好居中时取偶数）。
 *    (5) 写入 Float16Array 的元素会自动做一次 Math.f16round 级的舍入；
 *        溢出到 65520 以上变成 Infinity（不是回绕，也与整数型定型数组不同）。
 *
 * 4. 常见陷阱
 *    (1) **整数精度只有 11 位**：float16 能精确表示的最大连续整数是 2048，
 *        超过之后步长变成 2：2049 落在中点、按 ties-to-even 变成 2048，2051 变成 2052。
 *        用它存 ID / 计数器必炸。
 *    (2) 0.1 在 float16 里是 0.0999755859375，相对误差约 2.4e-4 —— 远大于 float32。
 *    (3) 累加会**放大**误差：反复做加法时，每次舍入的误差会累积，且可能单向漂移。
 *    (4) 65520 及以上溢出为 Infinity（不回绕、不夹紧），65519.99 也会舍入成 65504。
 *    (5) 次正规数最小到 2^-24 ≈ 5.96e-8，比它更小的数会**平滑地**变成 0（下溢为 0）。
 *    (6) NaN 的载荷（payload）不会保留：任何 NaN 写进去再读出来都是同一个规范 NaN。
 *    (7) 特性检测：Float16Array 在 Node 22+ / 较新浏览器上才可用；
 *        Math.f16round 与 DataView.getFloat16 也是同期引入的。
 *        用前必须探测，本文件给出了完整的手写降级实现（第 5 节）。
 *    (8) 定型数组的 toBase64 / toHex（见 13_native_base64_and_hex.js）只加在
 *        **Uint8Array** 上，Float16Array 没有 —— 要转字节必须先经过 .buffer / Uint8Array 视图。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/12_float16array.js
 *
 * 【预期输出】
 *   分 8 个小节：特性探测、半精度的位结构、创建与内存对比、DataView 与 Math.f16round、
 *   精度损失实证、手写降级实现、与原生的逐位交叉验证、交付前检查清单。
 *   凡随运行环境变化的行都标注 [环境相关]。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性探测：新 API 必须先问"在不在"
// ---------------------------------------------------------------------------

// 复用同一块 8 字节内存来读取 double 的原始位（第 5 节的手写实现要用）。
// 放在文件最前面是因为第 0 节的降级路径就会调用它 —— 函数声明会提升，const 不会，
// 所以这类"共享暂存区"必须声明在任何调用之前。
const F64_SCRATCH = new DataView(new ArrayBuffer(8));

console.log('--- 0. 特性探测 ---');

const HAS_FLOAT16_ARRAY = typeof Float16Array === 'function';
const HAS_F16ROUND = typeof Math.f16round === 'function';
const HAS_DATAVIEW_F16 =
  typeof DataView.prototype.getFloat16 === 'function' &&
  typeof DataView.prototype.setFloat16 === 'function';

console.log('[环境相关] Node 版本                       =', process.version);
console.log('[环境相关] V8 版本                         =', process.versions.v8);
console.log('Float16Array 可用吗                       =', HAS_FLOAT16_ARRAY);
console.log('Math.f16round 可用吗                      =', HAS_F16ROUND);
console.log('DataView 的 getFloat16/setFloat16 可用吗   =', HAS_DATAVIEW_F16);

console.table(
  [
    ['Float16Array', HAS_FLOAT16_ARRAY, 'Node 22+ / 新版浏览器（ES2025）'],
    ['Math.f16round', HAS_F16ROUND, '与 Float16Array 同期引入'],
    ['DataView.getFloat16', HAS_DATAVIEW_F16, '与 Float16Array 同期引入'],
    ['Float16Array.BYTES_PER_ELEMENT === 2', HAS_FLOAT16_ARRAY && Float16Array.BYTES_PER_ELEMENT === 2, '固定为 2 字节'],
    [
      '与其他定型数组共享同一套原型方法',
      HAS_FLOAT16_ARRAY && Object.getPrototypeOf(Float16Array) === Object.getPrototypeOf(Float32Array),
      '都挂在 %TypedArray% 下（见 03 篇）',
    ],
  ].map(([api, ok, note]) => ({ API: api, 可用: ok, 说明: note })),
);

if (!HAS_FLOAT16_ARRAY || !HAS_F16ROUND) {
  console.log('\n本运行时缺少部分 Float16 支持 —— 下面的演示会自动走第 5 节的手写降级实现。');
} else {
  console.log('\n本运行时完整支持 Float16 系列 API。');
}

// 统一的"舍入到半精度"入口：有原生用原生，没有用手写实现（第 5 节定义）。
// 这里可以先写调用、后写实现，因为函数声明会被提升。
console.log('\nMath.f16round 的直观效果（返回值仍是普通 number，只是值被"对齐"到了半精度网格上）：');
for (const v of [0.1, 1 / 3, 0.0999755859375, 2048, 2049, 2050, 1e-8, 65504, 65519.99, 65520]) {
  console.log(`  f16round(${String(v).padEnd(22)}) = ${String(f16round(v)).padEnd(22)} 与输入相等吗？ ${f16round(v) === v}`);
}
console.log('  注意 2049 -> 2048 而不是 2050：超过 2048 之后步长变成 2，2049 正好落在两条网格线的');
console.log('  中点，按 roundTiesToEven 取偶数那条（2048 的尾数是偶数）。2051 则会变成 2052。');
console.log('  65519.99 -> 65504（最大正规数），65520 -> Infinity（溢出）。');

// ---------------------------------------------------------------------------
// 1. 半精度的位结构：1 符号 + 5 指数 + 10 尾数
// ---------------------------------------------------------------------------

console.log('\n--- 1. 半精度的位结构 ---');

/**
 * 把 16 位整数展开成 "s eeeee mmmmmmmmmm" 的形式，便于肉眼对照。
 * @param {number} bits 0 ~ 65535
 * @returns {string}
 */
function bitsToLayout(bits) {
  const b = (bits & 0xffff).toString(2).padStart(16, '0');
  return `${b.slice(0, 1)} ${b.slice(1, 6)} ${b.slice(6)}`;
}

/**
 * 把半精度位模式翻译成可读的数学形式（含次正规数与特殊值）。
 * @param {number} bits 16 位整数
 * @returns {string}
 */
function describeHalf(bits) {
  const isNegative = (bits >> 15) === 1;
  const exp = (bits >> 10) & 0x1f;
  const frac = bits & 0x3ff;
  const signText = isNegative ? '-' : '';
  if (exp === 0 && frac === 0) return `${signText}0`;
  if (exp === 0) {
    return `${signText}0.${frac.toString(2).padStart(10, '0')} x 2^-14  (次正规数)`;
  }
  if (exp === 31) return frac === 0 ? `${signText}Infinity` : 'NaN';
  return `${signText}1.${frac.toString(2).padStart(10, '0')} x 2^${exp - 15}`;
}

console.log('三种浮点格式的位划分：');
console.table([
  { 格式: 'Float16 (half)', 总位数: 16, 符号: 1, 指数: 5, 尾数: 10, 偏置: 15, 有效十进制位: '约 3 位' },
  { 格式: 'Float32 (single)', 总位数: 32, 符号: 1, 指数: 8, 尾数: 23, 偏置: 127, 有效十进制位: '约 7 位' },
  { 格式: 'Float64 (double)', 总位数: 64, 符号: 1, 指数: 11, 尾数: 52, 偏置: 1023, 有效十进制位: '约 16 位' },
].map((r) => r));

/**
 * 取一个数字的半精度位模式（原生与降级都能用的统一入口）。
 * @param {number} value 任意数字
 * @param {boolean} useNative 是否优先用 DataView.setFloat16
 * @returns {number} 0 ~ 65535
 */
function halfBitsOf(value, useNative) {
  if (useNative) {
    const dv = new DataView(new ArrayBuffer(2));
    dv.setFloat16(0, value, false); // 大端序，只为了打印位模式时顺序直观
    return dv.getUint16(0, false);
  }
  return numberToFloat16Bits(value);
}

console.log('几个"里程碑"值的位模式：');
console.table(
  [
    ['+0', 0],
    ['-0', -0],
    ['最小次正规数 2^-24', 2 ** -24],
    ['最小正规数 2^-14', 2 ** -14],
    ['1', 1],
    ['1.5', 1.5],
    ['最大连续整数 2048', 2048],
    ['最大正规数 65504', 65504],
    ['溢出 65520 -> Inf', 65520],
    ['+Infinity', Infinity],
    ['NaN', NaN],
  ].map(([name, value]) => {
    const bits = halfBitsOf(value, HAS_DATAVIEW_F16);
    return {
      名称: name,
      位模式: `0x${bits.toString(16).toUpperCase().padStart(4, '0')}`,
      's eeeee mmmmmmmmmm': bitsToLayout(bits),
      释义: describeHalf(bits),
    };
  }),
);

console.log('读表要点：');
console.log('  · 特殊值的位模式与 float32/float64 完全同构，只是位数不同：');
console.log('    指数全 0 = 零或次正规数，指数全 1 = Infinity 或 NaN；');
console.log('  · 指数只有 5 位 => 指数范围 1~30 => 正规数 2^-14 ~ 2^15，');
console.log('    最大正规数是 (2 - 2^-10) * 2^15 = 65504；');
console.log('  · 比 2^-14 更小的数进入**次正规数**区间，最小到 2^-24 ≈ 5.96e-8；');
console.log('    小于 2^-25 的数直接下溢成 0（不是回绕，而是"平滑地消失"）；');
console.log('  · 10 位尾数 + 1 位隐含位 = 11 位有效二进制 = 2^11 = 2048，');
console.log('    这就是"最大连续整数是 2048"的来历。');

// ---------------------------------------------------------------------------
// 2. 创建方式与内存对比
// ---------------------------------------------------------------------------

console.log('\n--- 2. 创建方式与内存对比 ---');

if (HAS_FLOAT16_ARRAY) {
  console.log('四种创建方式（与 03_typed_array_types.js 讲的完全一致）：');
  const byLength = new Float16Array(4);
  console.log('  new Float16Array(4)             -> length =', byLength.length, ', byteLength =', byLength.byteLength, ', 内容 =', Array.from(byLength).join(','));

  const byArray = new Float16Array([1, 0.1, 1.5, 65504, 65520, 1e-8]);
  console.log('  new Float16Array([1, 0.1, ...]) ->', Array.from(byArray).join(', '));
  console.log('    注意 0.1 变成 0.0999755859375，65520 变成 Infinity，1e-8 变成 0');

  const fromF32 = new Float16Array(new Float32Array([1 / 3, 2 / 3]));
  console.log('  由 Float32Array 转换             ->', Array.from(fromF32).join(', '), '（逐元素舍入，不是位拷贝）');

  const shared = new ArrayBuffer(8);
  const view = new Float16Array(shared);
  view[0] = 1.5;
  console.log('  由 ArrayBuffer 建视图            ->',
    Array.from(new Uint8Array(shared).slice(0, 2), (b) => b.toString(16).padStart(2, '0')).join(' '),
    '（1.5 的半精度位模式是 0x3E00，小端序存成 00 3E）');
  console.log('    注意这里用的是 Uint8Array 视图 —— Float16Array 自己没有 toHex/toBase64，');
  console.log('    要序列化成文本必须先转成字节视图（见 13_native_base64_and_hex.js）。');
} else {
  console.log('本运行时没有 Float16Array —— 用降级实现演示同样的运算：');
  console.log('  f16round(0.1)        =', f16round(0.1));
  console.log('  f16round(65520)      =', f16round(65520));
  console.log('  把半精度位 0x3E00 还原 =', float16BitsToNumber(0x3e00), '（1.5）');
}

console.log('\n内存对比（同样存 1 000 000 个数）：');
const N = 1_000_000;
console.table(
  [
    ['Float16Array', 2],
    ['Float32Array', 4],
    ['Float64Array', 8],
  ].map(([name, bytes]) => ({
    类型: name,
    每元素字节: bytes,
    '1e6 个数的字节数': `${(N * bytes) / 1e6} MB`,
    '相对 Float64 的比例': `${((bytes / 8) * 100).toFixed(0)}%`,
  })),
);
console.log('  float16 相比 float32 省一半，相比 float64 省 75% —— 这就是 ML 推理偏爱它的原因。');
console.log('  带宽同理：从显存读 1 亿个参数，float16 只要 200MB，float32 要 400MB。');

if (HAS_FLOAT16_ARRAY) {
  const count = 100_000;
  const f16 = new Float16Array(count);
  const f32 = new Float32Array(count);
  const f64 = new Float64Array(count);
  console.table([
    { 类型: 'Float16Array', 元素数: f16.length, 实际字节数: f16.byteLength, BYTES_PER_ELEMENT: Float16Array.BYTES_PER_ELEMENT },
    { 类型: 'Float32Array', 元素数: f32.length, 实际字节数: f32.byteLength, BYTES_PER_ELEMENT: Float32Array.BYTES_PER_ELEMENT },
    { 类型: 'Float64Array', 元素数: f64.length, 实际字节数: f64.byteLength, BYTES_PER_ELEMENT: Float64Array.BYTES_PER_ELEMENT },
  ].map((r) => r));
}

// ---------------------------------------------------------------------------
// 3. DataView 与 Math.f16round
// ---------------------------------------------------------------------------

console.log('\n--- 3. DataView 与 Math.f16round ---');

if (HAS_DATAVIEW_F16) {
  const buf = new ArrayBuffer(8);
  const dv = new DataView(buf);
  const values = [1.0, -2.5, 0.1, 65504];
  values.forEach((v, i) => dv.setFloat16(i * 2, v, true)); // 小端序
  console.log('写入 4 个半精度数（小端序）:', values.join(', '));
  console.log('  字节视图 =', Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join(' '));
  console.log('  逐个读回 =', values.map((v, i) => dv.getFloat16(i * 2, true)).join(', '));
  console.log('  注意 0.1 读回来是', dv.getFloat16(4, true), '—— 存进去的那一刻就丢了精度');
  console.log('  端序演示：同一份字节按大端读 ->', values.map((v, i) => dv.getFloat16(i * 2, false)).join(', '));
  console.log('  => 端序参数绝不能省。半精度只有 2 字节，读反了会得到一个完全不同的数。');
} else {
  console.log('本运行时没有 DataView.getFloat16/setFloat16 —— 用降级实现演示：');
  console.log('  0.1 的半精度位模式 ->', `0x${numberToFloat16Bits(0.1).toString(16).toUpperCase()}`);
  console.log('  再还原回来         ->', float16BitsToNumber(numberToFloat16Bits(0.1)));
}

console.table([
  { API: 'Float16Array', 作用: '存储：一整块半精度内存，可索引读写', 返回值: '定型数组', 典型场景: '权重矩阵、顶点数组' },
  { API: 'DataView.getFloat16/setFloat16', 作用: '按字节偏移读写单个半精度数', 返回值: 'number（读）/ undefined（写）', 典型场景: '解析二进制协议与文件格式' },
  { API: 'Math.f16round', 作用: '单纯舍入，不涉及任何存储', 返回值: 'number（仍是双精度）', 典型场景: '算误差、做量化、写测试断言' },
].map((r) => r));
console.log('  三者共享完全相同的舍入规则（roundTiesToEven），所以结果可以互相验证。');
console.log('  Math.f16round 最容易误解：它**不改变数据类型**，只是把值对齐到半精度网格上。');
console.log('  幂等性可以证明"值已经落在网格上"：');
console.log('    f16round(0.1) !== 0.1        ->', f16round(0.1) !== 0.1, '（0.1 不在网格上）');
console.log('    f16round(f16round(0.1)) === f16round(0.1) ->', f16round(f16round(0.1)) === f16round(0.1), '（第一次舍入后就落上了）');

// ---------------------------------------------------------------------------
// 4. 精度损失的实证
// ---------------------------------------------------------------------------

console.log('\n--- 4. 精度损失的实证 ---');

console.log('4.1 同一个数在三种精度下的表示差异');
console.table(
  [0.1, 1 / 3, 0.7, 1e-5, 12345.6789, 2049, 1e-8].map((v) => {
    const h = f16round(v);
    const f = Math.fround(v);
    return {
      原始值: v,
      'Float16 表示': h,
      'Float32 表示': f,
      'Float64 表示': v,
      'Float16 相对误差': v === 0 ? '-' : (Math.abs(h - v) / Math.abs(v)).toExponential(3),
      'Float32 相对误差': v === 0 ? '-' : (Math.abs(f - v) / Math.abs(v)).toExponential(3),
    };
  }),
);
console.log('  读表要点：');
console.log('    · float16 的相对误差约 1e-3 量级（2^-11 ≈ 4.9e-4），float32 约 1e-7 量级；');
console.log('    · 2049 这个整数在 float16 里直接变成 2048 —— **整数也开始不精确**；');
console.log('    · 1e-5 在 float16 里还有值（落在次正规数区间），1e-8 就已经下溢成 0。');

console.log('\n4.2 累加误差会被放大（这是真正危险的地方）');
/**
 * 用指定精度把 0.1 累加 n 次。
 * @param {'f16'|'f32'|'f64'} kind 精度
 * @param {number} n 次数
 * @returns {number} 累加结果
 */
function accumulate(kind, n) {
  const step = 0.1;
  if (kind === 'f16' && HAS_FLOAT16_ARRAY) {
    // 关键是"读回来 -> 加 -> 写回去"：写回那一刻会做一次半精度舍入，
    // 下一次循环读到的就是舍入后的值 —— 误差就是这样一步步累积的。
    const arr = new Float16Array(1);
    for (let i = 0; i < n; i += 1) arr[0] = arr[0] + step;
    return arr[0];
  }
  if (kind === 'f16') {
    // 降级：每一步都经过一次手写的半精度舍入，模拟 Float16Array 的写入行为。
    let acc = 0;
    for (let i = 0; i < n; i += 1) acc = float16BitsToNumber(numberToFloat16Bits(acc + step));
    return acc;
  }
  if (kind === 'f32') {
    const arr = new Float32Array(1);
    for (let i = 0; i < n; i += 1) arr[0] = arr[0] + step;
    return arr[0];
  }
  let acc = 0;
  for (let i = 0; i < n; i += 1) acc += step;
  return acc;
}

console.log('把 0.1 连续累加，看误差如何随步数漂移（"理想值" = n * 0.1）：');
console.table(
  [10, 100, 1000, 10000].map((n) => {
    const ideal = n * 0.1;
    const h = accumulate('f16', n);
    const f = accumulate('f32', n);
    const d = accumulate('f64', n);
    return {
      累加次数: n,
      理想值: ideal,
      'Float16 结果': h,
      'Float16 绝对误差': Math.abs(h - ideal).toExponential(3),
      'Float32 绝对误差': Math.abs(f - ideal).toExponential(3),
      'Float64 绝对误差': Math.abs(d - ideal).toExponential(3),
    };
  }),
);
console.log('  float16 的误差比 float32 高若干个数量级 —— 而且它是**累积**的：');
console.log('  每一次加法都要把结果舍入到半精度网格上，1 万次就积累了 1 万个舍入误差，');
console.log('  并且当累加值变大后，网格步长也随之变大，后加入的小量会被整个"吃掉"。');
console.log('  最戏剧性的是 10000 次那一行：float16 的结果**卡在 256 再也不动了**。');
console.log('  原因：256 处的网格步长是 2^8 * 2^-10 = 0.25，而每次只加 0.1，');
console.log('  0.1 比半个步长还小，于是 256 + 0.1 每次都被舍回 256 —— 累加器"死"了。');
console.log('  这不是 bug，而是浮点网格的必然结果；在真实系统里表现为');
console.log('  "训练跑久了 loss 不再下降""统计值卡住不动"这类极难定位的问题。');
console.log('  这就是"用 float16 做累加/求和/统计"必须格外小心的原因：');
console.log('  常见做法是**用 float32/float64 累加，只在存储时降到 float16**（混合精度）。');

// 把"卡住"这件事单独演示一遍，更直观：
console.log('\n  单独看 float16 累加 0.1 的轨迹（每 2000 步采样一次）：');
if (HAS_FLOAT16_ARRAY) {
  const trace = new Float16Array(1);
  const samples = [];
  for (let i = 1; i <= 10000; i += 1) {
    trace[0] = trace[0] + 0.1;
    if (i % 2000 === 0) samples.push({ 步数: i, 'Float16 累加值': trace[0], '理想值': i * 0.1, '本步网格步长': 2 ** (Math.floor(Math.log2(Math.max(trace[0], 1))) - 10) });
  }
  console.table(samples);
  console.log('  判据是"加数是否大于半个网格步长"：');
  console.log('    步长 0.125 时，半个步长是 0.0625 < 0.1 -> 还能推动，只是每次跳 0.125；');
  console.log('    步长 0.25 时，半个步长是 0.125 > 0.1 -> 舍入回原值，彻底卡死。');
} else {
  console.log('    （本运行时没有 Float16Array，跳过轨迹采样）');
}

console.log('\n4.3 点积运算：ML 里最常见的混合精度场景');
/**
 * 两个向量的点积，可指定输入与累加的精度。
 * @param {number[]} a 向量 a
 * @param {number[]} b 向量 b
 * @param {'f16'|'f32'|'f64'} accKind 累加精度
 * @param {boolean} roundInputs 是否把输入降到半精度
 * @returns {number}
 */
function dot(a, b, accKind, roundInputs) {
  let acc = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = roundInputs ? f16round(a[i]) : a[i];
    const y = roundInputs ? f16round(b[i]) : b[i];
    const product = x * y;
    if (accKind === 'f64') acc += product;
    else if (accKind === 'f32') acc = Math.fround(acc + product);
    else acc = f16round(acc + product);
  }
  return acc;
}

const dim = 512;
const vecA = Array.from({ length: dim }, (_, i) => Math.sin(i * 0.37) * 0.1);
const vecB = Array.from({ length: dim }, (_, i) => Math.cos(i * 0.21) * 0.1);
const exact = dot(vecA, vecB, 'f64', false);
const relErr = (x) => (Math.abs(x - exact) / Math.abs(exact)).toExponential(3);
console.table([
  { 方案: '全 float64（基准）', 结果: exact, 相对误差: '0' },
  { 方案: '输入降 f16，累加 f64', 结果: dot(vecA, vecB, 'f64', true), 相对误差: relErr(dot(vecA, vecB, 'f64', true)) },
  { 方案: '输入降 f16，累加 f32', 结果: dot(vecA, vecB, 'f32', true), 相对误差: relErr(dot(vecA, vecB, 'f32', true)) },
  { 方案: '输入降 f16，累加 f16（最省）', 结果: dot(vecA, vecB, 'f16', true), 相对误差: relErr(dot(vecA, vecB, 'f16', true)) },
].map((r) => r));
console.log('  结论与工程实践完全一致：');
console.log('    · 把**存储**降到 f16、把**累加**留在 f32/f64，精度损失很小；');
console.log('    · 连累加也用 f16 时误差明显放大 —— 省下的那点内存不值得。');
console.log('    这就是"混合精度推理"的核心取舍：存储用低精度，累加用高精度。');

// ---------------------------------------------------------------------------
// 5. 手写降级实现（不支持时使用，同时用于与原生交叉验证）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 手写降级实现 ---');

// 思路：**不要经过 float32**。double -> float16 与 double -> float32 -> float16 是两次舍入，
// 在"刚好落在两条网格线之间"的值上会给出不同结果（双重舍入误差）。
// 所以直接拆解 float64 的位：拿到 53 位有效数字（用 BigInt 保证精确）后一次性舍入到 11 位。
// 共享的读取暂存区 F64_SCRATCH 已经在文件最前面声明过了。

/**
 * 把 BigInt 整数按 roundTiesToEven 舍入到 mant / 2^shiftExp。
 * 规则：小数部分 > 0.5 进位；< 0.5 舍去；**正好等于 0.5 时取偶数**。
 * 这一条"取偶数"是手写实现能与原生逐位一致的唯一保证。
 * @param {bigint} mant 被除数
 * @param {number} shiftExp 右移位数（负数表示左移）
 * @returns {bigint}
 */
function roundShift(mant, shiftExp) {
  if (shiftExp <= 0) return mant << BigInt(-shiftExp);
  const shift = BigInt(shiftExp);
  const quotient = mant >> shift;
  const remainder = mant & ((1n << shift) - 1n);
  const half = 1n << (shift - 1n);
  if (remainder > half || (remainder === half && (quotient & 1n) === 1n)) return quotient + 1n;
  return quotient;
}

/**
 * 手写的 double -> float16 位模式转换（与原生 roundTiesToEven 完全等效）。
 * @param {number} value 任意数字
 * @returns {number} 0 ~ 65535
 */
function numberToFloat16Bits(value) {
  F64_SCRATCH.setFloat64(0, value);
  const hi = F64_SCRATCH.getUint32(0);
  const lo = F64_SCRATCH.getUint32(4);
  const sign = hi >>> 31 ? 0x8000 : 0;
  const expBits = (hi >>> 20) & 0x7ff;
  const fracBits = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);

  // 特殊值：指数全 1 -> Infinity 或 NaN
  if (expBits === 0x7ff) return sign | (fracBits === 0n ? 0x7c00 : 0x7e00);

  // 把 |value| 拆成 mant * 2^exp 的形式（mant 是整数，位数 <= 53）
  let mant = fracBits;
  let exp = -1074; // 次正规 double 的隐含指数
  if (expBits !== 0) {
    mant = fracBits | (1n << 52n); // 补上被省略的最高位 1
    exp = expBits - 1075; // 去掉偏置，再减去尾数位数
  }
  if (mant === 0n) return sign; // ±0

  // k = floor(log2(|value|))，即最高有效位的位置
  const k = exp + (mant.toString(2).length - 1);

  // 情况一：落在次正规数区间 -> 值 = m16 * 2^-24，m16 在 0 ~ 1023
  if (k < -14) {
    const m16 = roundShift(mant, -(exp + 24));
    if (m16 === 0n) return sign; // 下溢为 ±0
    if (m16 >= 1024n) return sign | 0x0400; // 刚好进位到最小正规数 2^-14
    return sign | Number(m16);
  }

  // 情况二：正规数 -> 值 = 1.mmmmmmmmmm x 2^k，尾数保留 10 位
  let h = roundShift(mant, k - exp - 10);
  let normK = k;
  if (h === 2048n) {
    // 舍入把尾数撑到了 2.0，等价于指数加一并把尾数归零
    h = 1024n;
    normK += 1;
  }
  const expField = normK + 15;
  if (expField >= 31) return sign | 0x7c00; // 溢出为 Infinity
  return sign | (expField << 10) | Number(h - 1024n);
}

/**
 * 手写的 float16 位模式 -> double 转换（这一步是精确的，不涉及舍入）。
 * @param {number} bits 0 ~ 65535
 * @returns {number}
 */
function float16BitsToNumber(bits) {
  const sign = bits & 0x8000 ? -1 : 1;
  const exp = (bits >> 10) & 0x1f;
  const frac = bits & 0x3ff;
  if (exp === 0) return sign * frac * 2 ** -24; // 次正规数（frac 为 0 时得到 ±0）
  if (exp === 31) return frac ? NaN : sign * Infinity;
  return sign * (1 + frac / 1024) * 2 ** (exp - 15);
}

/**
 * 舍入到半精度（原生 Math.f16round 的降级替身）。
 * @param {number} value 任意数字
 * @returns {number}
 */
function f16round(value) {
  if (HAS_F16ROUND) return Math.f16round(value);
  return float16BitsToNumber(numberToFloat16Bits(value));
}

console.log('降级实现已就绪：numberToFloat16Bits / float16BitsToNumber / f16round。');
console.log('  只用 BigInt 与 DataView，不依赖任何 Float16 API；');
console.log('  关键是**直接从 double 位一次性舍入**，绕开"先转 float32 再转 float16"的双重舍入陷阱。');

// ---------------------------------------------------------------------------
// 6. 交叉验证：手写实现 vs 原生
// ---------------------------------------------------------------------------

console.log('\n--- 6. 交叉验证 ---');

const EDGE_CASES = [
  0, -0, 1, -1, 0.1, 0.5, 1.5, -2.75, 2048, 2049, 2050, 65504, 65519.99, 65520, 65536,
  1e39, -1e39, 1e-5, 6e-8, 5.96e-8, 2 ** -24, 2 ** -25, 3e-8, 1e-8, 1e-45, 1 / 3,
  Math.PI, Number.MIN_VALUE, Number.MAX_VALUE, Infinity, -Infinity, NaN,
];

if (HAS_F16ROUND) {
  // 6.1 边界值逐个对比
  let caseMismatch = 0;
  const caseDetail = [];
  for (const v of EDGE_CASES) {
    const mine = float16BitsToNumber(numberToFloat16Bits(v));
    const native = Math.f16round(v);
    const same = Object.is(mine, native) || (Number.isNaN(mine) && Number.isNaN(native));
    if (!same) {
      caseMismatch += 1;
      caseDetail.push({ 输入: v, 手写: mine, 原生: native });
    }
  }
  console.log(`6.1 边界值抽样：${EDGE_CASES.length} 个，不一致 ${caseMismatch} 个`);
  if (caseDetail.length > 0) console.table(caseDetail);

  // 6.2 穷举全部 65536 个位模式：值 -> 位模式必须回到原位
  let roundTripErrors = 0;
  let checked = 0;
  const rtDetail = [];
  for (let bits = 0; bits < 0x10000; bits += 1) {
    const exp = (bits >> 10) & 0x1f;
    const frac = bits & 0x3ff;
    // NaN 的载荷不会被保留（任何 NaN 写进去都是同一个规范 NaN），跳过这些位模式。
    if (exp === 31 && frac !== 0) continue;
    checked += 1;
    const value = float16BitsToNumber(bits);
    if (numberToFloat16Bits(value) !== bits) {
      roundTripErrors += 1;
      if (rtDetail.length < 5) {
        rtDetail.push({ 位模式: `0x${bits.toString(16)}`, 值: value, 回不去: `0x${numberToFloat16Bits(value).toString(16)}` });
      }
    }
  }
  console.log(`6.2 穷举往返：${checked} 个非 NaN 位模式，错误 ${roundTripErrors} 个`);
  if (rtDetail.length > 0) console.table(rtDetail);
  console.log('    这一步同时验证了编码与解码两个方向 —— 任何一位算错都会立刻暴露。');

  // 6.3 随机采样（跨 90 个数量级）
  const TRIALS = 200000;
  let randomMismatch = 0;
  for (let i = 0; i < TRIALS; i += 1) {
    const v = (Math.random() - 0.5) * 10 ** (Math.random() * 90 - 45);
    const mine = float16BitsToNumber(numberToFloat16Bits(v));
    const native = Math.f16round(v);
    if (!(Object.is(mine, native) || (Number.isNaN(mine) && Number.isNaN(native)))) randomMismatch += 1;
  }
  console.log(`6.3 随机采样：${TRIALS} 个随机值（跨 90 个数量级），不一致 ${randomMismatch} 个`);

  // 6.4 与 DataView 交叉验证（第三条独立路径）
  if (HAS_DATAVIEW_F16) {
    let dvMismatch = 0;
    for (const v of EDGE_CASES) {
      if (Number.isNaN(v)) continue; // NaN 的位模式比较没有意义
      const dv = new DataView(new ArrayBuffer(2));
      dv.setFloat16(0, v, false);
      if (dv.getUint16(0, false) !== numberToFloat16Bits(v)) dvMismatch += 1;
    }
    console.log(`6.4 与 DataView.setFloat16 的位模式对比：不一致 ${dvMismatch} 个`);
  }

  // 6.5 与 Float16Array 交叉验证（第四条独立路径）
  if (HAS_FLOAT16_ARRAY) {
    const arr = new Float16Array(EDGE_CASES.length);
    EDGE_CASES.forEach((v, i) => {
      arr[i] = v;
    });
    let arrayMismatch = 0;
    for (let i = 0; i < EDGE_CASES.length; i += 1) {
      const a = arr[i];
      const b = float16BitsToNumber(numberToFloat16Bits(EDGE_CASES[i]));
      if (!(Object.is(a, b) || (Number.isNaN(a) && Number.isNaN(b)))) arrayMismatch += 1;
    }
    console.log(`6.5 与 Float16Array 逐元素对比：${EDGE_CASES.length} 个值，不一致 ${arrayMismatch} 个`);
    console.log('    四条独立路径（手写舍入 / Math.f16round / DataView / Float16Array）结果一致。');
  }

  console.log('\n交叉验证的意义：降级实现不是"猜"出来的，而是**可以证明与原生等价**的。');
  console.log('  验证方式就是上面这套：边界值 + 穷举位模式 + 随机采样 + 多条独立路径比对。');
} else {
  console.log('本运行时没有 Math.f16round，无法做原生对照 ——');
  console.log('  但手写实现依然可用，下面是它的自洽性检查：');

  let selfErrors = 0;
  let checked = 0;
  for (let bits = 0; bits < 0x10000; bits += 1) {
    const exp = (bits >> 10) & 0x1f;
    const frac = bits & 0x3ff;
    if (exp === 31 && frac !== 0) continue;
    checked += 1;
    if (numberToFloat16Bits(float16BitsToNumber(bits)) !== bits) selfErrors += 1;
  }
  console.log(`  穷举往返：${checked} 个位模式，错误 ${selfErrors} 个`);
  console.log('  幂等性：f16round(f16round(0.1)) === f16round(0.1) ->', f16round(f16round(0.1)) === f16round(0.1));
}

console.log('\n6.6 反例：经过 float32 中转会不会出问题？');
/**
 * 朴素（不推荐）的降级写法：先把输入降到 float32，再转成 float16。
 * @param {number} value 输入
 * @returns {number} float16 位模式
 */
function viaFloat32(value) {
  return numberToFloat16Bits(Math.fround(value));
}
let dualRoundingDiff = 0;
for (let i = 0; i < 200000; i += 1) {
  const v = (Math.random() - 0.5) * 10 ** (Math.random() * 20 - 10);
  if (viaFloat32(v) !== numberToFloat16Bits(v)) dualRoundingDiff += 1;
}
console.log(`  随机 200000 个值里，两条路径给出不同位模式的有 ${dualRoundingDiff} 个。`);
console.log('  在 float16 的可表示范围内，float32 的精度远高于 float16，所以绝大多数情况下');
console.log('  双重舍入不会出错 —— 真正危险的是"刚好卡在两条 float16 网格线附近"的值，');
console.log('  那种情况下两次舍入可能把结果推到错误的一侧，而且极难复现。');
console.log('  生产代码的做法不是"小心"，而是**根本不经过 float32** —— 这正是上面实现的做法。');

// ---------------------------------------------------------------------------
// 7. 交付前检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 7. Float16Array 检查清单 ---');

console.table(
  [
    ['是否做了 Float16Array / Math.f16round 的特性探测？', 'Node 22+ 才有；旧环境会抛 TypeError'],
    ['要存的数据是"大范围 + 低精度"吗？', '权重、像素、亮度适合；金额、ID、时间戳绝对不适合'],
    ['整数是否超过 2048？', 'float16 的最大连续整数是 2048，超过就会"跳着走"'],
    ['累加/求和是否留在了 float32/float64？', '混合精度：存储用 f16，累加用 f32/f64'],
    ['是否处理了溢出（65520+ -> Infinity）？', '它不回绕也不夹紧，会静默变成无穷'],
    ['是否处理了下溢（< 2^-25 -> 0）？', '极小值会平滑地变成 0，做除法前要防御'],
    ['NaN 载荷是否需要保留？', 'float16 只保留"是不是 NaN"，不保留位模式'],
    ['端序是否显式指定？', 'DataView 的第二个参数传 false/true，别依赖默认值'],
    ['与 Float32Array 之间是逐元素转换还是位拷贝？', '构造时是逐元素转换；要位拷贝请共用同一个 ArrayBuffer'],
    ['序列化是否先转成 Uint8Array 视图？', 'Float16Array 没有 toBase64/toHex（只有 Uint8Array 有）'],
    ['是否有"与降级实现逐位一致"的测试？', '穷举 65536 个位模式往返 + 随机采样，见第 6 节'],
  ].map(([检查项, 做法], i) => ({ '#': i + 1, 检查项, 做法 })),
);

console.log('\n一句话总结：');
console.log('  float16 是"用精度换内存与带宽"的工具，它的价值在**存储与传输**，不在**计算**。');
console.log('  内存省一半、带宽省一半，代价是 3 位有效数字和 65504 的上限。');
console.log('  只要把"累加"留在高精度、把"存储"放低精度，这笔交易就非常划算。');

console.log('\n本节结束。');
