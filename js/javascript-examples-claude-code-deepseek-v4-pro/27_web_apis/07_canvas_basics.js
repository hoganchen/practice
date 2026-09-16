/**
 * ============================================================================
 * 知识点：画布绘制（Node 端用字符画模拟像素缓冲区）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/06_url_and_history.js、08_arrays（数组）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    <canvas> 是 HTML 里的一块"画布"，它提供一个可以用 JavaScript 绘制的位图区域。
 *    拿到 2D 上下文 ctx = canvas.getContext('2d') 之后，你就拥有了一套完整的
 *    2D 绘图 API：矩形、路径、圆、曲线、文字、图片、渐变、变换矩阵、裁剪……
 *    画布本身不记录"我画过什么图形"，它只保存"最终那一堆像素"——
 *    这叫做"立即模式（immediate mode）"绘图，与 SVG 的"保留模式"正好相反。
 *
 * 2. 为什么需要
 *    网页上的图表、数据可视化、图片裁剪、小游戏、粒子动画、图片压缩、
 *    手写签名板……都建立在 canvas 之上。它是浏览器里唯一能"逐像素"操作的手段。
 *
 * 3. 核心语法要点
 *    - 取上下文：const ctx = canvas.getContext('2d')
 *    - 坐标系：原点 (0,0) 在左上角，x 向右、y 向下，单位是 CSS 像素。
 *    - 矩形：fillRect(x,y,w,h) / strokeRect(x,y,w,h) / clearRect(x,y,w,h)
 *    - 路径：beginPath() → moveTo / lineTo / arc / quadraticCurveTo / closePath
 *            → fill() 或 stroke()。路径是"积累"的，beginPath 会清空它。
 *    - 样式：fillStyle / strokeStyle（颜色、渐变、图案）、lineWidth、
 *            lineCap、lineJoin、globalAlpha、shadowBlur。
 *    - 文字：ctx.font = '20px sans-serif'；fillText(text,x,y)、strokeText、
 *            measureText(text).width。注意行高基线与 textAlign/textBaseline。
 *    - 变换：save() / restore() 成对使用；translate / rotate / scale / transform。
 *    - 像素级：getImageData / putImageData / createImageData（注意跨域污染问题）。
 *    - 动画：requestAnimationFrame(cb) 让浏览器在下一次重绘之前调用你的回调
 *            （通常每秒 60 次），比 setInterval 更省电、更平滑，切到后台会自动降频。
 *
 * 4. 常见陷阱
 *    - canvas 有"两套尺寸"：CSS 尺寸（元素在页面上的大小）和位图尺寸
 *      （width/height 属性）。只改 CSS 会拉伸模糊，必须同时设 attribute。
 *      高分屏下常用 devicePixelRatio 放大位图再缩放回来。
 *    - 忘记 beginPath()：新旧路径会连在一起，画出莫名其妙的线。
 *    - fillRect 不会改变当前路径，但 fill() 会用 fillStyle 填充整条当前路径。
 *    - canvas 上的图形不是 DOM 节点，不能被 CSS 选中，也不能绑定事件；
 *      点击检测要靠坐标计算（或用 isPointInPath）。
 *    - 清空画布要用 clearRect，重新设置 width 也会清空画布（并重置全部状态）。
 *    - getImageData 读取被跨域图片"污染"过的画布会抛 SecurityError。
 *
 * 【本文件在 Node 中如何演示】
 *    Node.js 没有渲染引擎，也没有 canvas。本文件用最朴素的方式复刻它的核心思想：
 *    用一个二维字符数组充当"像素缓冲区"（每个格子是一个字符，而不是一个 RGBA 像素），
 *    然后自己实现 setPixel / fillRect / lineTo / arc / fillText / 变换矩阵 /
 *    帧循环（requestAnimationFrame 的等价物），最后把缓冲区逐行打印到终端。
 *    算法（Bresenham 画线、中点画圆、点阵字形）与浏览器内部做的事完全一致，
 *    差别只在于：浏览器把像素写进显存，这里把字符写进数组。
 *
 * 【运行方法】
 *   node 27_web_apis/07_canvas_basics.js
 *
 * 【预期输出】
 *   在终端里用字符画依次绘制：矩形、直线、圆、数字文字、带变换的组合图形，
 *   最后播放一段 4 帧的位移动画。
 * ============================================================================
 */

// ===========================================================================
// 第 1 部分：字符版"画布"
// ===========================================================================

console.log('--- 1. 构造一个字符像素缓冲区（相当于 canvas 的位图） ---');

/**
 * 字符画布：用一个 width × height 的二维数组当像素缓冲区。
 * 浏览器里的 canvas 是 width × height × 4 字节的 RGBA 数组，思路完全一样。
 */
class CharCanvas {
  /**
   * @param {number} width 画布宽度（字符数）
   * @param {number} height 画布高度（行数）
   * @param {string} background 背景字符（相当于 clearRect 的颜色）
   */
  constructor(width, height, background = '.') {
    this.width = width;
    this.height = height;
    this.background = background;
    this.buffer = []; // 二维数组：buffer[y][x] = 字符
    this.clear();
    // 当前绘图状态（对应 ctx.fillStyle / lineWidth 等）
    this.fillChar = '#';
    this.strokeChar = '*';
    // 变换矩阵（对应 ctx.translate/rotate/scale 的累加结果）
    this.tx = 0;
    this.ty = 0;
    this.scale = 1;
  }

  /** 对应 ctx.clearRect(0,0,w,h)：把整个缓冲区填成背景字符 */
  clear() {
    this.buffer = [];
    for (let y = 0; y < this.height; y++) {
      this.buffer.push(new Array(this.width).fill(this.background));
    }
  }

  /** 对应 ctx.save()：把当前绘图状态压栈 */
  save() {
    this._saved = { tx: this.tx, ty: this.ty, scale: this.scale, fillChar: this.fillChar, strokeChar: this.strokeChar };
  }

  /** 对应 ctx.restore()：恢复上一次 save() 的状态 */
  restore() {
    if (!this._saved) return;
    Object.assign(this, this._saved);
    this._saved = null;
  }

  /**
   * 对应 ctx.translate(x, y)：设置平移量。
   * 真实 canvas 里变换是"累乘"到变换矩阵上的，这里简化为直接设置偏移。
   */
  translate(x, y) {
    this.tx = x;
    this.ty = y;
  }

  /** 把用户坐标转换成缓冲区下标（相当于矩阵变换的最终效果） */
  _project(x, y) {
    return { px: Math.round(x * this.scale + this.tx), py: Math.round(y * this.scale + this.ty) };
  }

  /**
   * 画一个"像素"。
   * 对应 ctx.fillRect(x, y, 1, 1) —— 浏览器里最小的绘制单位就是一个像素。
   */
  setPixel(x, y, char) {
    const { px, py } = this._project(x, y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return; // 越界裁剪（canvas 也会自动裁剪）
    this.buffer[py][px] = char ?? this.fillChar;
  }

  /** 对应 ctx.fillRect(x, y, w, h) */
  fillRect(x, y, w, h, char) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        this.setPixel(x + i, y + j, char);
      }
    }
  }

  /** 对应 ctx.strokeRect(x, y, w, h)：只画边框 */
  strokeRect(x, y, w, h, char) {
    for (let i = 0; i < w; i++) {
      this.setPixel(x + i, y, char);
      this.setPixel(x + i, y + h - 1, char);
    }
    for (let j = 0; j < h; j++) {
      this.setPixel(x, y + j, char);
      this.setPixel(x + w - 1, y + j, char);
    }
  }

  /**
   * 画线：Bresenham 直线算法。
   * 它只用整数加减法就决定每一步该往哪个方向走，是计算机图形学最经典的算法之一。
   * 浏览器里的 ctx.lineTo() 内部用的也是这类"光栅化"算法。
   */
  drawLine(x0, y0, x1, y1, char = this.strokeChar) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const endX = Math.round(x1);
    const endY = Math.round(y1);

    const dx = Math.abs(endX - x);
    const dy = -Math.abs(endY - y);
    const sx = x < endX ? 1 : -1; // x 方向每次走一步
    const sy = y < endY ? 1 : -1; // y 方向每次走一步
    let err = dx + dy; // 累积误差，决定这一步走 x 还是走 y

    for (;;) {
      this.setPixel(x, y, char);
      if (x === endX && y === endY) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * 画圆：参数方程 x = cx + r·cosθ, y = cy + r·sinθ。
   * 浏览器里对应 ctx.arc(cx, cy, r, 0, Math.PI*2) + ctx.stroke()。
   * 这里用足够密的步长采样，保证圆周上没有断点（步长越小越连续）。
   */
  drawCircle(cx, cy, r, char = this.strokeChar, steps = 0) {
    const total = steps || Math.max(24, Math.ceil(2 * Math.PI * r * 2));
    for (let i = 0; i < total; i++) {
      const theta = (i / total) * Math.PI * 2;
      this.setPixel(cx + r * Math.cos(theta), cy + r * Math.sin(theta), char);
    }
  }

  /** 填充圆：对应 ctx.arc(...) + ctx.fill()，逐行算出该行圆的左右边界 */
  fillCircle(cx, cy, r, char = this.fillChar) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      const dy = y - cy;
      const half = Math.sqrt(Math.max(0, r * r - dy * dy)); // 勾股定理求半弦长
      for (let x = Math.ceil(cx - half); x <= Math.floor(cx + half); x++) {
        this.setPixel(x, y, char);
      }
    }
  }

  /** 把缓冲区逐行打印出来（相当于把画布显示在屏幕上） */
  render() {
    const lines = this.buffer.map((row) => row.join(''));
    console.log(lines.map((l) => '  |' + l + '|').join('\n'));
  }
}

const W = 46;
const H = 16;
const canvas = new CharCanvas(W, H, '.');
console.log(`  画布尺寸：${W} × ${H} 个字符（相当于 canvas 的位图尺寸）`);
console.log('');

// ===========================================================================
// 第 2 部分：矩形
// ===========================================================================

console.log('--- 2. 矩形：fillRect / strokeRect / clearRect ---');

canvas.clear();
canvas.fillRect(2, 2, 10, 5, '#'); // 实心矩形
canvas.strokeRect(14, 2, 10, 5, '#'); // 空心矩形
canvas.fillRect(28, 2, 16, 5, '.'); // 用背景字符"擦了"一块 → 等价于 clearRect
canvas.drawLine(28, 2, 43, 6, 'o'); // 在对角方向画一条线
canvas.render();
console.log('  说明：canvas 没有"删除图形"的接口，只能像上面这样用背景色盖掉，');
console.log('        这正是 clearRect(x,y,w,h) 做的事。');
console.log('');

// ===========================================================================
// 第 3 部分：路径与线
// ===========================================================================

console.log('--- 3. 路径：moveTo / lineTo 画折线与多边形 ---');

canvas.clear();
// 一次"路径"= 一串连续的坐标点，对应 ctx.beginPath() 之后的 moveTo/lineTo 序列
const polyline = [
  [1, 14],
  [8, 4],
  [15, 12],
  [22, 3],
  [29, 13],
  [36, 5],
  [44, 14],
];
for (let i = 0; i < polyline.length - 1; i++) {
  const [x0, y0] = polyline[i];
  const [x1, y1] = polyline[i + 1];
  canvas.drawLine(x0, y0, x1, y1, '*'); // 每段 lineTo
  canvas.setPixel(x0, y0, 'o'); // 折点用 o 标出来
}
canvas.render();
console.log('  浏览器里的等价代码：');
console.log('    ctx.beginPath();');
console.log('    ctx.moveTo(1, 14); ctx.lineTo(8, 4); ctx.lineTo(15, 12); ...');
console.log('    ctx.stroke();   // 一次性把整条路径描边');
console.log('  陷阱：下次画新路径前一定要 ctx.beginPath()，否则新旧路径会被连起来。');
console.log('');

// ===========================================================================
// 第 4 部分：圆与圆弧
// ===========================================================================

console.log('--- 4. 圆：arc(cx, cy, r, startAngle, endAngle) ---');

canvas.clear();
canvas.drawCircle(10, 8, 6, '#'); // 描边圆
canvas.fillCircle(28, 8, 6, '@'); // 填充圆
// 半圆：角度从 0 到 π，对应 ctx.arc(40, 8, 6, 0, Math.PI)
for (let i = 0; i <= 40; i++) {
  const theta = (i / 40) * Math.PI; // 0 → π 只扫半圈
  canvas.setPixel(40 + 5 * Math.cos(theta), 8 + 5 * Math.sin(theta), '#');
}
canvas.render();
console.log('  浏览器里的等价代码：');
console.log("    ctx.beginPath(); ctx.arc(10, 8, 6, 0, Math.PI * 2); ctx.stroke();  // 整圆描边");
console.log("    ctx.beginPath(); ctx.arc(28, 8, 6, 0, Math.PI * 2); ctx.fill();    // 整圆填充");
console.log("    ctx.beginPath(); ctx.arc(40, 8, 5, 0, Math.PI);     ctx.stroke();  // 半圆（0 到 π）");
console.log('  角度约定：0 弧度在"正右方"（3 点钟方向），顺时针为正（因为 y 轴向下）。');
console.log('');

// ===========================================================================
// 第 5 部分：文字
// ===========================================================================

console.log('--- 5. 文字：fillText 的本质是把字形点阵贴到画布上 ---');

/**
 * 一个 3×5 的点阵字模。浏览器里的字体文件里存的就是这种"每个字符对应一组覆盖点"，
 * 只不过精度高得多（比如 16×16 或矢量轮廓）并且带抗锯齿。
 */
const FONT_3X5 = {
  0: ['###', '# #', '# #', '# #', '###'],
  1: [' # ', '## ', ' # ', ' # ', '###'],
  2: ['###', '  #', '###', '#  ', '###'],
  3: ['###', '  #', '###', '  #', '###'],
  4: ['# #', '# #', '###', '  #', '  #'],
  5: ['###', '#  ', '###', '  #', '###'],
  6: ['###', '#  ', '###', '# #', '###'],
  7: ['###', '  #', '  #', '  #', '  #'],
  8: ['###', '# #', '###', '# #', '###'],
  9: ['###', '# #', '###', '  #', '###'],
  ':': ['   ', ' # ', '   ', ' # ', '   '],
};

/**
 * 逐字符把点阵贴到画布上。
 * 对应 ctx.fillText('12:34', x, y)。
 * @param {string} text 只支持上面字模里有的字符
 * @param {number} x 起始列
 * @param {number} y 起始行（浏览器里 y 是文字基线，这里取顶边）
 * @param {number} [scale] 放大倍数（对应 ctx.scale()）
 */
function fillText(canvas2d, text, x, y, scale = 1) {
  let cursorX = x;
  for (const ch of text) {
    const glyph = FONT_3X5[ch];
    if (!glyph) {
      cursorX += 4 * scale; // 不认识的字符留个空位（相当于字体缺字）
      continue;
    }
    for (let row = 0; row < glyph.length; row++) {
      for (let col = 0; col < glyph[row].length; col++) {
        if (glyph[row][col] === '#') {
          // 放大时把每个点铺成 scale×scale 的方块（对应 ctx.scale 的效果）
          canvas2d.fillRect(cursorX + col * scale, y + row * scale, scale, scale, '@');
        }
      }
    }
    cursorX += 4 * scale; // 3 列字形 + 1 列字距
  }
  return cursorX - x; // 返回绘制宽度，相当于 ctx.measureText(text).width
}

canvas.clear();
const textWidth = fillText(canvas, '12:34', 1, 1, 1); // 原始大小
fillText(canvas, '9:5', 22, 1, 2); // 放大 2 倍（对应 ctx.scale(2,2)）
fillText(canvas, '9:05', 1, 8, 1); // 再画一行小字
canvas.render();
console.log('  fillText 返回的绘制宽度 =', textWidth, '（相当于 measureText().width）');
console.log("  浏览器里的等价代码：ctx.font = '48px monospace'; ctx.fillText('12:34', 20, 60);");
console.log('  要点：canvas 的文字是"画上去的像素"，画完就不再是文字了，');
console.log('        不能选中、不能搜索、不能用 CSS 改颜色（改色要重画）。');
console.log('');

// ===========================================================================
// 第 6 部分：变换（平移 / 缩放）
// ===========================================================================

console.log('--- 6. 变换：save / translate / restore ---');

canvas.clear();
// 用同一个绘图函数，在不同变换下画出多个图形 —— 这就是变换的价值
function drawStar(c, cx, cy, r) {
  c.save();
  c.translate(cx, cy); // 把原点挪到图形的中心
  for (let i = 0; i < 8; i++) {
    const theta = (i / 8) * Math.PI * 2;
    c.setPixel(r * Math.cos(theta), r * Math.sin(theta), '+');
  }
  c.drawLine(-r, 0, r, 0, '-');
  c.drawLine(0, -r, 0, r, '|');
  c.restore(); // 恢复原点和样式，不影响后面的绘制
}

drawStar(canvas, 8, 8, 6);
drawStar(canvas, 24, 8, 5);
canvas.scale = 1;
drawStar(canvas, 38, 8, 3);
canvas.render();
console.log('  浏览器里的等价代码：');
console.log('    ctx.save();              // 先存档');
console.log('    ctx.translate(cx, cy);   // 平移坐标系');
console.log('    ...绘制图形（用相对坐标）...');
console.log('    ctx.restore();           // 读档，坐标系复原');
console.log('  save/restore 必须成对出现，否则坐标系会越画越偏（这是最常见的 canvas bug）。');
console.log('');

// ===========================================================================
// 第 7 部分：动画（模拟 requestAnimationFrame）
// ===========================================================================

console.log('--- 7. 动画：requestAnimationFrame 的等价物 ---');

/**
 * 浏览器里 requestAnimationFrame(cb) 会把 cb 排到"下一次重绘之前"执行，
 * 通常每秒 60 次，并且会自动与屏幕刷新率同步、切到后台时暂停。
 * Node 里没有渲染循环，用 setTimeout 模拟一个固定帧率的循环。
 */
function requestFrame(cb, fps = 25) {
  return setTimeout(() => cb(), Math.round(1000 / fps));
}

const animCanvas = new CharCanvas(40, 10, '.');
const FRAMES = 4;

/**
 * 每一帧：清空 → 按时间算出位置 → 绘制 → 显示。
 * 这是所有 canvas 动画的标准结构（浏览器里也是这四步）。
 */
function frame(index) {
  const t = index / (FRAMES - 1); // 0 → 1 的进度
  animCanvas.clear();

  // 小球的水平位置随时间前进（用正弦做一点缓动，看起来更自然）
  const x = 2 + t * 32;
  const y = 5 + Math.sin(t * Math.PI * 2) * 3;
  animCanvas.fillCircle(x, y, 2, '@');

  // 地面
  for (let i = 0; i < 40; i++) animCanvas.setPixel(i, 9, '=');

  console.log(`  第 ${index + 1}/${FRAMES} 帧（t=${t.toFixed(2)}）:`);
  animCanvas.render();
  console.log('');
}

console.log('  浏览器里的等价代码：');
console.log('    function frame(timestamp) {');
console.log('      ctx.clearRect(0, 0, w, h);   // 1. 清空上一帧');
console.log('      update(timestamp);            // 2. 按时间算新位置');
console.log('      draw(ctx);                    // 3. 重画');
console.log('      requestAnimationFrame(frame); // 4. 预约下一帧');
console.log('    }');
console.log('    requestAnimationFrame(frame);   // 启动循环');
console.log('');

// 逐帧执行（用 await 串起来，保证输出顺序清晰、且在全部结束后才退出）
for (let i = 0; i < FRAMES; i++) {
  frame(i);
  await new Promise((resolve) => requestFrame(resolve));
}

// ===========================================================================
// 第 8 部分：浏览器与 Node 的差异总结
// ===========================================================================

console.log('--- 8. 浏览器与 Node 的差异 ---');
console.log('  1) 浏览器有真正的 canvas 元素和 GPU 加速的渲染管线；');
console.log('     Node 没有渲染引擎，本文件用二维字符数组模拟像素缓冲区。');
console.log('  2) 浏览器里一个像素是 4 个字节（R/G/B/A，各 0-255）；');
console.log('     这里一个"像素"是一个字符。');
console.log('  3) 浏览器有 requestAnimationFrame，与屏幕刷新率同步；');
console.log('     这里用 setTimeout 模拟固定帧率。');
console.log('  4) 浏览器可以直接读到鼠标坐标做点击检测；');
console.log('     Node 里"点击"这个概念不存在。');
console.log('  5) 算法层面完全一致：光栅化直线、采样画圆、字形点阵、变换矩阵，');
console.log('     都是同一套东西 —— 这也是学习 canvas 时值得亲手实现一遍的原因。');
console.log('');
console.log('程序结束。');
