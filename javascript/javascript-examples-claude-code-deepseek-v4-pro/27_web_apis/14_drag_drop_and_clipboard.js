/**
 * ============================================================================
 * 知识点：拖放 API（Drag and Drop）与剪贴板 API（Clipboard）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/02_dom_events.js（事件、事件对象、事件流）、
 *             27_web_apis/11_blob_file_formdata.js（Blob / File / DataTransfer 里的文件）、
 *             27_web_apis/13_cross_context_messaging.js（结构化克隆与安全上下文）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - 拖放 API：一套基于"事件序列 + dataTransfer 数据仓库"的机制，让用户能把
 *      一个元素（或一段文字、一批文件）从 A 处拖到 B 处。拖动过程中浏览器会
 *      依次派发 dragstart → drag → dragenter → dragover → dragleave → drop → dragend。
 *    - 剪贴板 API：navigator.clipboard 提供的异步读写接口（readText / writeText /
 *      read / write），用于程序化地读、写系统剪贴板。
 *
 * 2. 为什么需要
 *    - 拖放是"所见即所得"的自然交互：拖拽排序、拖文件上传、看板（Kanban）拖卡片、
 *      可视化搭建。它们都依赖拖放事件流。
 *    - 剪贴板则是"复制粘贴"这一最基础交互的编程接口：一键复制邀请码、
 *      粘贴富文本进编辑器、从剪贴板读图片直接上传。
 *
 * 3. 拖放的核心语法要点
 *    （1）7 个事件，各有分工
 *         dragstart  在"被拖动的元素"上触发一次，是**唯一能写数据**的时机
 *         drag       在源元素上持续触发（每 ~350ms 一次）
 *         dragenter  进入某个可放置目标时触发
 *         dragover   在目标上持续触发，**必须 preventDefault() 才允许 drop**
 *         dragleave  离开目标时触发
 *         drop       在目标上触发，在这里读数据、做业务
 *         dragend    在源元素上触发一次，无论成功与否
 *
 *    （2）draggable 属性
 *         图片、链接默认可拖；其它元素必须显式写 draggable="true"。
 *         <a> 与 <img> 拖出来的是浏览器默认数据（URL），不是你的自定义数据。
 *
 *    （3）dataTransfer：拖放过程中的"数据仓库"
 *         dt.setData(format, data)   format 是 MIME，如 'text/plain'、'text/html'、
 *                                    'text/uri-list'、'application/x-my-app-id'
 *         dt.getData(format)
 *         dt.clearData([format])
 *         dt.types                  已存在的数据格式列表（**在 dragover 阶段只能看它**）
 *         dt.files                  FileList，拖入文件时才有
 *         dt.items                  更底层的列表，可拿到 DataTransferItem.kind/type
 *         dt.effectAllowed          源允许的效果：'copy' / 'move' / 'link' / 'none' / ...
 *         dt.dropEffect             目标实际接受的效果（决定鼠标光标是 + 还是箭头）
 *         dt.setDragImage(img, x, y) 自定义拖动时跟随鼠标的缩略图
 *
 *    （4）最关键的一条规则：**受保护模式（protected mode）**
 *         拖动过程中，数据仓库有 3 种状态：
 *           dragstart 期间   → read/write，可以 setData
 *           dragenter/dragover → protected，**getData 一律返回空字符串**，
 *                                只能通过 dt.types 知道"有哪些格式"
 *           drop 期间        → read-only，可以 getData，不能 setData
 *         所以业务判断（"能不能放这里"）在 dragover 只能靠 dt.types。
 *
 * 4. 剪贴板的核心语法要点
 *      await navigator.clipboard.writeText('要复制的文本');
 *      const text = await navigator.clipboard.readText();
 *      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': blob })]);
 *      const items = await navigator.clipboard.read();   // 得到一个 ClipboardItem 数组
 *
 *    （1）为什么必须在用户手势里调用
 *        剪贴板里可能躺着密码、验证码、私钥、刚复制的钱包地址。如果任意脚本
 *        能在后台静默读取，那它就是一个"合法键盘记录器"；如果能随意写入，
 *        就能在你复制钱包地址时把它悄悄换成攻击者的地址（剪贴板劫持）。
 *        所以规范强制要求：**安全上下文（https 或 localhost）+ 短暂用户激活
 *        （transient activation，即刚刚有一次真实点击/按键）+ 权限授权**。
 *    （2）安全上下文
 *        http 站点、file:// 页面都不算安全上下文。在这些环境下
 *        navigator.clipboard 直接是 undefined，或者调用时抛 NotAllowedError。
 *    （3）权限
 *        clipboard-write：页面处于激活状态时通常自动授予。
 *        clipboard-read ：必须显式授权，浏览器会弹窗询问。
 *        权限状态可以用 navigator.permissions.query({ name: 'clipboard-read' }) 查询。
 *    （4）降级方案（老浏览器 / 非安全上下文下的三级火箭）
 *        ① navigator.clipboard.*（现代异步 API）
 *        ② document.execCommand('copy')（已废弃，但兼容性极好，需要先选中一段文本）
 *        ③ 手动兜底：把内容放进只读输入框并全选，提示用户按 Ctrl+C
 *
 * 5. 常见陷阱
 *    - **忘记在 dragover 里 preventDefault()** → drop 事件根本不触发。
 *      这是拖放最经典的"为什么我的 drop 没反应"。
 *    - 在 dragover 里 getData() 拿不到数据（受保护模式）→ 只能看 dt.types。
 *    - dragenter / dragleave 会随着鼠标划过子元素而反复触发，
 *      在容器上做高亮会闪烁。解法：用计数器，或判断 e.relatedTarget 是否还在容器内。
 *    - 拖放文件时，能拿到 File 对象，但拿不到它的完整本地路径（安全限制）。
 *    - 移动端浏览器基本不支持 HTML5 拖放，需要用 Pointer/Touch 事件自己实现。
 *    - 剪贴板 API 在 file:// 下不可用；在 iframe 里需要 allow="clipboard-read; clipboard-write"。
 *    - execCommand('copy') 必须在用户手势的**同步调用栈**里执行，
 *      放进 await 之后就会失效（因为手势已经过期）。
 *
 * 【本文件在 Node 中如何演示】
 *   Node.js 里没有 DOM、没有事件系统、没有剪贴板，也没有"拖放"这个概念。
 *   所以本文件用两个**状态机模拟**把这两套 API 的规则完整复现出来：
 *
 *   1) 拖放：手写一个 DragSimulator，按真实顺序派发 7 个事件，
 *      并严格实现"受保护模式"与"dragover 不 preventDefault 就不给 drop"这两条规则。
 *      同时演示 dragenter/dragleave 闪烁问题及其解法。
 *      → 事件名、事件顺序、dataTransfer 语义都与浏览器一致。
 *
 *   2) 剪贴板：把真实的约束条件（安全上下文 / 用户手势 / 权限）抽成三个开关，
 *      做成一个 Clipboard 模拟器。然后演示三级降级方案如何逐级回退。
 *      → Node 里确实没有任何剪贴板 API；真要读写系统剪贴板只能靠
 *        子进程调用平台工具（Windows 的 clip.exe / Get-Clipboard，
 *        macOS 的 pbcopy / pbpaste，Linux 的 xclip），既不跨平台也依赖外部程序，
 *        所以本文件用模拟的方式来把"什么时候会失败、失败后怎么降级"讲清楚。
 *
 * 【运行方法】
 *   node 27_web_apis/14_drag_drop_and_clipboard.js
 *
 * 【预期输出】
 *   两个大段落：
 *     1. 拖放事件序列的完整回放（成功拖放 / 失败的拖放 / 子元素闪烁问题与修复）；
 *     2. 剪贴板读写的各种失败场景（非安全上下文 / 无用户手势 / 权限被拒）
 *        以及三级降级方案的实际回退过程。
 * ============================================================================
 */

/** 分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

/** 缩进打印 */
function log(indent, text) {
  console.log('  '.repeat(indent) + text);
}

// ===========================================================================
// 第 1 部分：拖放事件序列状态机
// ===========================================================================

section('--- 1. 拖放事件序列：一个真实的状态机 ---');

/**
 * 模拟 DataTransfer。
 * 这是拖放 API 的核心对象，它同时扮演三个角色：
 *   1) 数据的载体（setData / getData / types）
 *   2) 效果协商的通道（effectAllowed / dropEffect）
 *   3) 拖入文件的入口（files / items）
 *
 * 最关键的规则是"受保护模式"：数据在不同阶段的可读写权限不同。
 */
class FakeDataTransfer {
  constructor() {
    this._store = new Map(); // 格式 → 数据（真实实现里是"拖放数据存储"）
    this.effectAllowed = 'uninitialized'; // 源允许的效果
    this.dropEffect = 'none'; // 目标实际接受的效果
    this.files = []; // 拖入的文件（File 对象数组，对应 FileList）
    this.items = []; // 更底层的条目列表
    this._mode = 'readwrite'; // 'readwrite' | 'protected' | 'readonly'
    this.dropEffectHistory = []; // 记录 dropEffect 的每次变化，便于观察协商过程
  }

  /** 当前所有可用的数据格式（dragover 阶段唯一能看的东西） */
  get types() {
    return Array.from(this._store.keys());
  }

  setData(format, data) {
    if (this._mode !== 'readwrite') {
      // 真实浏览器在 drop 阶段调用 setData 会静默失败（read-only 模式），
      // 在 dragover 阶段也写不进去。这里如实模拟。
      log(2, `[dataTransfer] ✗ setData("${format}") 被拒绝：当前处于 ${this._mode} 模式`);
      return;
    }
    this._store.set(format, String(data));
    log(2, `[dataTransfer] setData("${format}", ${JSON.stringify(String(data).slice(0, 40))}) 成功`);
  }

  getData(format) {
    if (this._mode === 'protected') {
      // 这就是"受保护模式"：dragover 阶段读不到数据，只能看 types。
      log(2, `[dataTransfer] getData("${format}") → ""（受保护模式，dragover 阶段读不到内容）`);
      return '';
    }
    const v = this._store.get(format);
    if (v === undefined) {
      log(2, `[dataTransfer] getData("${format}") → ""（没有这个格式）`);
      return '';
    }
    log(2, `[dataTransfer] getData("${format}") → ${JSON.stringify(v.slice(0, 40))}`);
    return v;
  }

  clearData(format) {
    if (format === undefined) this._store.clear();
    else this._store.delete(format);
    log(2, `[dataTransfer] clearData(${format === undefined ? '全部' : '"' + format + '"'})`);
  }

  /** 设置效果（会记录历史，方便观察 effectAllowed 与 dropEffect 的协商） */
  setDropEffect(effect) {
    this.dropEffect = effect;
    this.dropEffectHistory.push(effect);
    log(2, `[dataTransfer] dropEffect = "${effect}"（决定鼠标光标显示为 + / 箭头 / 禁止）`);
  }

  /** 切换模式（由模拟器在正确的时机调用，对应浏览器内部的行为） */
  _setMode(mode) {
    this._mode = mode;
  }
}

/** 一个模拟的 DragEvent */
class FakeDragEvent {
  constructor(type, dataTransfer, extra = {}) {
    this.type = type;
    this.dataTransfer = dataTransfer;
    this.defaultPrevented = false;
    this.cancelable = true;
    Object.assign(this, extra); // relatedTarget / clientX / clientY 等
  }

  /** 事件处理器调用它表示"我要接管这次默认行为" */
  preventDefault() {
    this.defaultPrevented = true;
  }
}

/**
 * 模拟一个可放置的目标（drop zone）。
 * handlers 是一个 { dragenter, dragover, dragleave, drop } 的映射。
 */
class DropZone {
  constructor(name, handlers = {}) {
    this.name = name;
    this.handlers = handlers;
    this.enterCount = 0; // 用于演示"子元素闪烁"的计数器解法
    this.highlighted = false;
    this.droppedPayloads = [];
  }

  /** 派发一个事件给本区域，返回它是否被 preventDefault 了 */
  dispatch(event) {
    const handler = this.handlers[event.type];
    if (typeof handler === 'function') handler(event);
    return event.defaultPrevented;
  }
}

/**
 * 拖放流程模拟器。
 * 它负责在正确的时机切换 dataTransfer 的模式、按正确顺序派发事件，
 * 并实现那条最关键的规则：**只有 dragover 被 preventDefault，drop 才会触发**。
 */
class DragSimulator {
  constructor() {
    this.lastDragOverPrevented = false; // 记录最近一次 dragover 的结果
    this.trace = []; // 事件轨迹
  }

  /** 内部：打印并记录一次事件派发 */
  _emit(target, event, label) {
    const prevented = target.dispatch(event);
    this.trace.push({ target: target.name, type: event.type, prevented });
    log(1, `→ ${event.type.padEnd(10)} 在 [${target.name}] 上派发，` +
      `defaultPrevented = ${prevented}${label ? '  ' + label : ''}`);
    return prevented;
  }

  /**
   * 开始拖拽。
   * @param {DropZone} source 被拖动的源（它也需要处理 dragstart / dragend）
   * @param {FakeDataTransfer} dt
   * @param {Function} fillData 在 dragstart 里给 dataTransfer 写数据的回调
   */
  dragStart(source, dt, fillData) {
    log(1, '【阶段 1】dragstart —— 唯一允许写入数据的时刻');
    dt._setMode('readwrite');
    dt.effectAllowed = 'copyMove'; // 源允许"复制"或"移动"
    const ev = new FakeDragEvent('dragstart', dt);
    if (typeof fillData === 'function') fillData(dt);
    dt._setMode('protected'); // dragstart 一结束，立刻进入受保护模式
    return this._emit(source, ev);
  }

  /** 拖拽过程中的 drag（在源上持续触发） */
  drag(source, dt) {
    const ev = new FakeDragEvent('drag', dt);
    return this._emit(source, ev, '（拖动中，每 ~350ms 一次）');
  }

  /** 进入目标 */
  dragEnter(target, dt, extra = {}) {
    dt._setMode('protected');
    const ev = new FakeDragEvent('dragenter', dt, extra);
    return this._emit(target, ev);
  }

  /** 在目标上移动（**必须 preventDefault 才会有 drop**） */
  dragOver(target, dt, extra = {}) {
    dt._setMode('protected');
    const ev = new FakeDragEvent('dragover', dt, extra);
    this.lastDragOverPrevented = this._emit(target, ev, '');
    // 把"这一步的后果"紧跟其后打印出来，因果关系一目了然
    if (this.lastDragOverPrevented) {
      log(2, '↳ 已 preventDefault()，浏览器放行 —— 松手时 drop 会被派发');
    } else {
      log(2, '↳ 没有 preventDefault()，浏览器保持默认的"禁止放置" —— 松手时 drop 不会来');
    }
    return this.lastDragOverPrevented;
  }

  /** 离开目标 */
  dragLeave(target, dt, extra = {}) {
    const ev = new FakeDragEvent('dragleave', dt, extra);
    return this._emit(target, ev);
  }

  /** 放下 */
  drop(target, dt) {
    log(1, '【drop 阶段】数据仓库切换为 readonly，可以读不能写');
    if (!this.lastDragOverPrevented) {
      log(2, '✗ 浏览器不会派发 drop 事件 —— 因为上一次 dragover 没有 preventDefault()。');
      log(2, '  这就是"为什么我的 drop 没反应"的头号原因。');
      return false;
    }
    dt._setMode('readonly');
    const ev = new FakeDragEvent('drop', dt);
    const ok = this._emit(target, ev);
    dt._setMode('protected');
    return ok;
  }

  /** 结束拖拽（无论成功失败都会触发） */
  dragEnd(source, dt) {
    log(1, '【阶段 3】dragend —— 无论成功失败都会在源元素上触发，适合做"收尾清理"');
    const ev = new FakeDragEvent('dragend', dt);
    this._emit(source, ev);
    dt._setMode('readwrite');
  }
}

// ---------------------------------------------------------------------------
// 场景 A：一次成功的拖放
// ---------------------------------------------------------------------------

console.log('场景 A：把一张"卡片"拖进一个"看板列"（dragover 里正确 preventDefault）');
console.log('');

const sim = new DragSimulator();
const dt = new FakeDataTransfer();
dt.files = []; // 这次拖的不是文件

const card = new DropZone('卡片#42（源）', {
  dragstart(e) {
    // 真实代码：
    //   e.dataTransfer.setData('text/plain', '卡片42');
    //   e.dataTransfer.setData('application/x-kanban-card', JSON.stringify({id:42}));
    //   e.dataTransfer.effectAllowed = 'move';
  },
  dragend() {
    // 真实代码：把源元素恢复成正常样式（去掉半透明等拖动中的视觉效果）
  },
});

const column = new DropZone('看板列「进行中」（目标）', {
  dragenter(e) {
    // 真实代码：给列加高亮样式
    column.highlighted = true;
  },
  dragover(e) {
    e.preventDefault(); // ← 这一行是 drop 能触发的唯一前提
    e.dataTransfer.dropEffect = 'move'; // 告诉浏览器"我要移动"，光标会显示成移动样式
  },
  dragleave() {
    column.highlighted = false;
  },
  drop(e) {
    e.preventDefault(); // 阻止浏览器默认行为（比如把链接当导航打开）
    const raw = e.dataTransfer.getData('application/x-kanban-card');
    const plain = e.dataTransfer.getData('text/plain');
    column.droppedPayloads.push({ raw, plain });
    log(2, '业务处理：把卡片 42 移动到「进行中」列');
  },
});

// ① dragstart：写入数据
sim.dragStart(card, dt, (d) => {
  d.setData('text/plain', '卡片42');
  d.setData('application/x-kanban-card', JSON.stringify({ id: 42, title: '修复登录 bug' }));
});

// ② drag：拖动中
sim.drag(card, dt);

// ③ dragenter + dragover：进入目标
sim.dragEnter(column, dt);
log(1, '（此刻在 dragover 里尝试读数据，看看受保护模式的效果）');
sim.dragOver(column, dt);
dt.getData('text/plain'); // 受保护模式 → 拿到空字符串
log(2, `但 dt.types 依然可读 → [${dt.types.join(', ')}]（业务判断只能靠它）`);

// ④ drop
sim.drop(column, dt);
log(2, `目标收到并解析出：${JSON.stringify(column.droppedPayloads)}`);

// ⑤ dragend
sim.dragEnd(card, dt);

console.log('');
console.log('事件轨迹：' + sim.trace.map((t) => t.type).join(' → '));
console.log('完整的浏览器事件顺序是：');
console.log('  dragstart → drag → dragenter → dragover → drop → dragend');
console.log('（如果中途离开目标，会在 drop 之前插入 dragleave；再进入就再来一轮 dragenter/dragover）');

// ---------------------------------------------------------------------------
// 场景 B：忘记 preventDefault 的失败拖放
// ---------------------------------------------------------------------------

section('场景 B：忘记在 dragover 里 preventDefault —— drop 永远不触发');

const sim2 = new DragSimulator();
const dt2 = new FakeDataTransfer();

const zoneBad = new DropZone('没写 preventDefault 的区域', {
  dragenter() {},
  dragover() {
    // 这里故意什么都不做 —— 这是初学者最常见的错误
  },
  drop() {
    log(2, '这行永远不会被打印，因为 drop 根本不会被派发');
  },
});

sim2.dragStart(new DropZone('源', {}), dt2, (d) => d.setData('text/plain', '拖我'));
sim2.dragEnter(zoneBad, dt2);
sim2.dragOver(zoneBad, dt2); // 返回 false
const dropped = sim2.drop(zoneBad, dt2);
console.log('');
console.log('drop 是否真的触发了：' + dropped);
console.log('现象：鼠标拖到区域上时，光标一直是"禁止"图标，松手什么也不发生。');
console.log('原因：dragover 的默认行为是"不允许放置"，只有 preventDefault() 才能推翻它。');
console.log('记忆口诀：**想接收拖放，dragover 和 drop 两个都写 preventDefault()**。');
console.log('         （drop 里那次是为了阻止浏览器对链接/文件的默认处理，比如直接打开文件）');

// ---------------------------------------------------------------------------
// 场景 C：dragenter / dragleave 的子元素闪烁问题
// ---------------------------------------------------------------------------

section('场景 C：dragenter / dragleave 在子元素上反复触发（高亮闪烁）');

console.log('问题描述：一个容器里有若干子元素。鼠标从容器边缘移动到子元素上时，');
console.log('          浏览器会先派发容器的 dragleave（因为离开了容器的"直接目标"），');
console.log('          再派发容器的 dragenter（因为子元素冒泡上来）。');
console.log('          于是高亮样式一闪一闪。');
console.log('');

/** 构造一个"带子元素的容器"的拖放模拟：用 dragenter/dragleave 成对计数 */
class NestedZone extends DropZone {
  constructor(name, childNames) {
    super(name);
    this.childNames = childNames;
    this.depth = 0; // 计数器解法：进入 +1，离开 -1，只有回到 0 才是真的离开
    this.naiveHighlight = false; // 天真解法的状态
  }
}

const nested = new NestedZone('容器（内含 3 个子元素）', ['子元素1', '子元素2', '子元素3']);

/**
 * 模拟鼠标路径：容器 → 子元素1 → 容器 → 子元素2 → 容器 → 容器外
 * 每一步都会在容器上派发对应的 dragenter / dragleave。
 */
function simulateMousePath(zone, path) {
  const naiveEvents = [];
  let naiveHighlight = false;

  for (const step of path) {
    if (step === '容器') {
      // 进入容器本身
      zone.depth += 1;
      naiveHighlight = true;
      naiveEvents.push({ step, type: 'dragenter', naive: naiveHighlight, depth: zone.depth });
    } else if (step.startsWith('子元素')) {
      // 进入子元素：浏览器先在容器上派发 dragleave，再派发 dragenter（子元素的事件冒泡）
      zone.depth -= 1;
      naiveHighlight = false;
      naiveEvents.push({ step, type: 'dragleave', naive: naiveHighlight, depth: zone.depth });
      zone.depth += 1;
      naiveHighlight = true;
      naiveEvents.push({ step, type: 'dragenter', naive: naiveHighlight, depth: zone.depth });
    } else {
      // 离开容器
      zone.depth -= 1;
      naiveHighlight = false;
      naiveEvents.push({ step, type: 'dragleave', naive: naiveHighlight, depth: zone.depth });
    }
  }
  return naiveEvents;
}

const mousePath = ['容器', '子元素1', '容器', '子元素2', '容器', '容器外'];
const naiveEvents = simulateMousePath(nested, mousePath);

console.log('鼠标路径：' + mousePath.join(' → '));
console.log('');
console.log('  步骤'.padEnd(12) + '事件'.padEnd(14) + '天真解法高亮'.padEnd(16) + '计数器解法高亮');
console.log('  ' + '-'.repeat(58));
for (const e of naiveEvents) {
  // 计数器解法：只有 depth > 0 才算"真的在里面"
  const counterHighlight = e.depth > 0;
  console.log('  ' + e.step.padEnd(10) + e.type.padEnd(14) +
    String(e.naive).padEnd(14) + String(counterHighlight));
}

const naiveFlips = naiveEvents.reduce((n, e, i) => (i > 0 && e.naive !== naiveEvents[i - 1].naive ? n + 1 : n), 0);
const counterFlips = naiveEvents.reduce((n, e, i) => {
  const cur = e.depth > 0;
  const prev = i > 0 && naiveEvents[i - 1].depth > 0;
  return i > 0 && cur !== prev ? n + 1 : n;
}, 0);
console.log('');
console.log(`高亮状态翻转次数：天真解法 ${naiveFlips} 次（会闪），计数器解法 ${counterFlips} 次（稳定）`);
console.log('');
console.log('计数器解法的代码长这样（这是最常用、最可靠的写法）：');
console.log('  let depth = 0;');
console.log("  zone.addEventListener('dragenter', () => { depth++; zone.classList.add('over'); });");
console.log("  zone.addEventListener('dragleave',  () => { depth--; if (depth === 0) zone.classList.remove('over'); });");
console.log("  zone.addEventListener('drop',       () => { depth = 0; zone.classList.remove('over'); });");
console.log('');
console.log('另一种解法：判断 relatedTarget 是否还在容器内');
console.log("  zone.addEventListener('dragleave', (e) => {");
console.log('    if (!zone.contains(e.relatedTarget)) zone.classList.remove("over"); // 真的离开了才取消高亮');
console.log('  });');
console.log('（relatedTarget 是"即将进入的那个元素"，如果它还在容器里，说明只是跨到了子元素上）');

// ---------------------------------------------------------------------------
// 场景 D：拖放文件
// ---------------------------------------------------------------------------

section('场景 D：拖拽文件到页面上');

const sim4 = new DragSimulator();
const dt4 = new FakeDataTransfer();

// 模拟用户从桌面拖进来两个文件（浏览器会帮我们填好 dt.files）
dt4.files = [
  { name: 'report.pdf', size: 248_320, type: 'application/pdf' },
  { name: 'photo.png', size: 1_048_576, type: 'image/png' },
];
dt4.items = dt4.files.map((f) => ({ kind: 'file', type: f.type, getAsFile: () => f }));

const dropArea = new DropZone('文件投放区', {
  dragover(e) {
    e.preventDefault(); // 必须
    // 注意：dragover 阶段读不到文件名，但能通过 dt.items 知道"拖的是文件"
    const isFileDrag = e.dataTransfer.items.some((it) => it.kind === 'file');
    e.dataTransfer.dropEffect = isFileDrag ? 'copy' : 'none';
    log(2, '检测到拖入的是文件，dropEffect = "copy"（光标显示为加号）');
  },
  drop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    log(2, `收到 ${files.length} 个文件：`);
    for (const f of files) {
      log(3, `· ${f.name}  ${(f.size / 1024).toFixed(1)} KB  ${f.type}`);
    }
    log(2, '接下来通常是：构造 FormData，逐个 append 后 fetch 上传。');
  },
});

sim4.dragStart(new DropZone('源（桌面）', {}), dt4, () => {
  // 从桌面/资源管理器拖进来的文件，不需要（也不能）手动 setData，
  // 浏览器已经帮你把 files 填好了。
});
sim4.dragEnter(dropArea, dt4);
sim4.dragOver(dropArea, dt4);
sim4.drop(dropArea, dt4);
sim4.dragEnd(new DropZone('源（桌面）', {}), dt4);

console.log('');
console.log('拖文件时的注意点：');
console.log('  · 通过 e.dataTransfer.files 拿到的是真正的 File 对象，可以读内容、可上传；');
console.log('  · 但**拿不到文件的完整本地路径**（f.path 之类），这是浏览器的安全设计；');
console.log('  · 想拒绝某类文件，要在 dragover 里把 dropEffect 设为 "none"，用户会看到禁止光标；');
console.log('  · 想阻止"把文件拖到页面上导致浏览器直接打开它"，要给 window 加');
console.log("    dragover/drop 监听并 preventDefault()，否则用户拖偏一点页面就被导航走了。");

// ===========================================================================
// 第 2 部分：剪贴板 API
// ===========================================================================

section('--- 2. 剪贴板 API：为什么要在用户手势里调用 ---');

/**
 * 模拟浏览器环境对剪贴板的三种约束。
 * 真实的剪贴板 API 只在同时满足以下条件时才可用：
 *   1) 安全上下文（https 或 localhost）—— file:// 与 http 都不算；
 *   2) 短暂用户激活（刚刚有点击/按键，默认窗口约 5 秒）；
 *   3) 相应权限被授予（clipboard-write 通常自动给，clipboard-read 要弹窗问）。
 */
class ClipboardEnv {
  constructor({ secureContext, userGesture, readPermission, writePermission }) {
    this.secureContext = secureContext; // 是否安全上下文
    this.userGesture = userGesture; // 是否有"刚刚的用户手势"
    this.readPermission = readPermission; // 'granted' | 'prompt' | 'denied'
    this.writePermission = writePermission;
    this.systemClipboard = null; // 真正存数据的地方（模拟系统剪贴板）
    this.writeLog = [];
  }

  /** 模拟 navigator.clipboard 是否存在 */
  get clipboardAvailable() {
    return this.secureContext; // 非安全上下文下 navigator.clipboard 是 undefined
  }
}

/** 模拟 navigator.clipboard 对象 */
class FakeClipboard {
  /** @param {ClipboardEnv} env */
  constructor(env) {
    this.env = env;
  }

  /**
   * 权限检查：这是所有失败场景的集中地。
   * 真实浏览器抛出的错误类型都是 NotAllowedError，但 message 不同，这里如实模拟。
   */
  _checkPermission(kind) {
    if (!this.env.secureContext) {
      const err = new Error(
        "Failed to execute 'writeText' on 'Clipboard': Document is not focused. " +
        '（页面不是安全上下文，剪贴板 API 不可用）',
      );
      err.name = 'NotAllowedError';
      throw err;
    }
    if (!this.env.userGesture) {
      const err = new Error(
        "Failed to execute 'writeText' on 'Clipboard': Document is not focused. " +
        '（没有用户手势：剪贴板只能在用户刚刚交互过之后访问）',
      );
      err.name = 'NotAllowedError';
      throw err;
    }
    const perm = kind === 'read' ? this.env.readPermission : this.env.writePermission;
    if (perm !== 'granted') {
      const err = new Error(
        `Failed to execute '${kind === 'read' ? 'readText' : 'writeText'}' on 'Clipboard': ` +
        `${perm === 'denied' ? 'Permission denied' : 'Permission dismissed'} ` +
        `（clipboard-${kind} 权限未授予，当前状态：${perm}）`,
      );
      err.name = 'NotAllowedError';
      throw err;
    }
  }

  async writeText(text) {
    this._checkPermission('write');
    this.env.systemClipboard = { kind: 'text/plain', text: String(text) };
    this.env.writeLog.push({ op: 'writeText', text: String(text) });
    return undefined;
  }

  async readText() {
    this._checkPermission('read');
    if (!this.env.systemClipboard) return '';
    return this.env.systemClipboard.text;
  }

  /** 写入多种格式（富文本场景：同时给 text/html 和 text/plain） */
  async write(items) {
    this._checkPermission('write');
    // items 是 ClipboardItem[]，每个 item 内部是 { 'MIME': Blob }
    const first = items[0];
    const types = Object.keys(first._data);
    this.env.systemClipboard = { kind: 'multi', types, data: first._data };
    this.env.writeLog.push({ op: 'write', types });
  }

  async read() {
    this._checkPermission('read');
    if (!this.env.systemClipboard) return [];
    return [this.env.systemClipboard];
  }
}

/** 模拟 ClipboardItem */
class FakeClipboardItem {
  constructor(data) {
    this._data = data; // { 'text/html': Blob, 'text/plain': Blob }
  }
  get types() {
    return Object.keys(this._data);
  }
}

/** 模拟 Permissions API 的查询 */
function queryClipboardPermission(env, name) {
  if (!env.secureContext) return { state: 'denied', name };
  if (name === 'clipboard-write') return { state: env.writePermission, name };
  if (name === 'clipboard-read') return { state: env.readPermission, name };
  return { state: 'prompt', name };
}

/** 把三种失败场景逐个跑一遍 */
async function tryClipboard(env, label, action) {
  console.log('');
  log(0, `【${label}】`);
  log(1, `secureContext = ${env.secureContext}，userGesture = ${env.userGesture}，` +
    `clipboard-read = ${env.readPermission}，clipboard-write = ${env.writePermission}`);
  const clipboard = new FakeClipboard(env);
  try {
    const result = await action(clipboard);
    log(1, '✓ 成功，返回值 = ' + JSON.stringify(result));
    return { ok: true, value: result };
  } catch (err) {
    log(1, `✗ ${err.name}: ${err.message}`);
    return { ok: false, error: err };
  }
}

// ---- 场景 1：file:// 下（非安全上下文）----
const envFile = new ClipboardEnv({
  secureContext: false,
  userGesture: true,
  readPermission: 'prompt',
  writePermission: 'granted',
});
await tryClipboard(envFile, '场景 1：file:// 或 http 页面（非安全上下文）', (c) => c.writeText('hello'));
log(1, '补充：在真实浏览器里，非安全上下文下 navigator.clipboard 直接是 undefined，');
log(1, '      所以通常连方法都调不到，会在第一步就走进降级分支。');

// ---- 场景 2：安全上下文，但没有用户手势 ----
const envNoGesture = new ClipboardEnv({
  secureContext: true,
  userGesture: false,
  readPermission: 'granted',
  writePermission: 'granted',
});
await tryClipboard(envNoGesture, '场景 2：https 页面，但调用发生在定时器里（无用户手势）', (c) =>
  c.writeText('偷偷写入'));
log(1, '典型的错误写法：setTimeout(() => navigator.clipboard.writeText(x), 1000) —— 手势早已过期。');
log(1, '正确写法：直接在 click 处理器里调用，不要 await 别的东西之后再调用。');

// ---- 场景 3：读取权限被拒绝 ----
const envDenied = new ClipboardEnv({
  secureContext: true,
  userGesture: true,
  readPermission: 'denied',
  writePermission: 'granted',
});
await tryClipboard(envDenied, '场景 3：https + 用户手势，但用户拒绝了 clipboard-read 权限', (c) => c.readText());
log(1, '注意：写入通常不需要授权，读取几乎一定要弹窗 —— 因为剪贴板里可能是密码。');

// ---- 场景 4：全部满足 ----
const envOk = new ClipboardEnv({
  secureContext: true,
  userGesture: true,
  readPermission: 'granted',
  writePermission: 'granted',
});
await tryClipboard(envOk, '场景 4：https + 用户手势 + 权限已授予', async (c) => {
  await c.writeText('邀请码：ABC-123');
  return c.readText();
});

// ---- 场景 5：写入多种格式（富文本）----
console.log('');
log(0, '【场景 5：一次写入多种格式（富文本复制）】');
{
  const env = new ClipboardEnv({
    secureContext: true,
    userGesture: true,
    readPermission: 'granted',
    writePermission: 'granted',
  });
  const clipboard = new FakeClipboard(env);
  try {
    // 真实代码：
    //   const item = new ClipboardItem({
    //     'text/html':  new Blob([html], { type: 'text/html' }),
    //     'text/plain': new Blob([plain], { type: 'text/plain' }),
    //   });
    //   await navigator.clipboard.write([item]);
    // 这样粘贴到 Word 里是带格式的，粘贴到记事本里是纯文本 —— 由目标程序自己选。
    const item = new FakeClipboardItem({
      'text/html': { __blob: true, type: 'text/html', body: '<b>加粗的标题</b>' },
      'text/plain': { __blob: true, type: 'text/plain', body: '加粗的标题' },
    });
    await clipboard.write([item]);
    log(1, '✓ 已写入，可用格式 = [' + item.types.join(', ') + ']');
    log(1, '粘贴时由**接收方**决定用哪种格式：Word 用 text/html，记事本用 text/plain。');
    const readBack = await clipboard.read();
    log(1, '读回来的是 ClipboardItem 数组，第 0 个的 types = [' + Object.keys(readBack[0].data || {}).join(', ') + ']');
  } catch (err) {
    log(1, '✗ ' + err.name + ': ' + err.message);
  }
}

// ===========================================================================
// 第 3 部分：剪贴板的三级降级方案
// ===========================================================================

section('--- 3. 剪贴板读写的降级方案（三级火箭） ---');

/**
 * 一个"打不死"的复制函数：
 *   ① Async Clipboard API（首选：异步、无副作用、支持富文本）
 *   ② document.execCommand('copy')（已废弃，但兼容到很老的浏览器；
 *      原理是把内容放进一个临时 textarea、选中、执行 copy 命令）
 *   ③ 手动兜底：把内容展示出来并全选，提示用户自己按 Ctrl+C
 *
 * 本文件把 document / execCommand 也一并模拟出来，方便完整演示回退路径。
 */
function createFakeDocument() {
  return {
    // 模拟 execCommand：它返回一个布尔值表示是否成功
    execCommand(command, _showUI, _value) {
      if (command !== 'copy') return false;
      // 真实实现里，这里会检查"当前是否有选区"，
      // 没有选区就直接返回 false（这是它最常见的失败原因）。
      if (!this._hasSelection) return false;
      this._clipboardAfterExec = this._selectionText;
      return true;
    },
    _hasSelection: false,
    _selectionText: '',
    _clipboardAfterExec: null,
    /** 模拟"选中一个临时元素里的文本" */
    selectText(text) {
      this._selectionText = text;
      this._hasSelection = true;
    },
    clearSelection() {
      this._selectionText = '';
      this._hasSelection = false;
    },
  };
}

/**
 * 通用复制函数（三级降级）。
 * @returns {Promise<{via: string, text: string}>} 最终是通过哪一级完成的
 */
async function copyText(text, { env, fakeDocument }) {
  // ---------- 第 1 级：Async Clipboard API ----------
  const clipboard = new FakeClipboard(env);
  if (env.clipboardAvailable) {
    try {
      await clipboard.writeText(text);
      return { via: 'navigator.clipboard.writeText（现代异步 API）', text };
    } catch (err) {
      log(2, '第 1 级失败：' + err.name + ' → 回退到第 2 级');
    }
  } else {
    log(2, '第 1 级不可用：navigator.clipboard 是 undefined（非安全上下文） → 回退到第 2 级');
  }

  // ---------- 第 2 级：document.execCommand('copy') ----------
  // 关键限制：它必须在用户手势的**同步调用栈**里执行。
  // 上面已经 await 过了，用户手势可能已经过期 —— 这正是它被淘汰的原因之一。
  if (!env.userGesture) {
    log(2, '第 2 级失败：execCommand 也要求用户手势，而手势已过期 → 回退到第 3 级');
  } else if (typeof fakeDocument.execCommand !== 'function') {
    log(2, '第 2 级失败：本环境没有 document.execCommand → 回退到第 3 级');
  } else {
    fakeDocument.selectText(text); // 必须先把文本变成"选中状态"
    const ok = fakeDocument.execCommand('copy');
    fakeDocument.clearSelection(); // 用完立刻清理临时节点/选区
    if (ok) {
      env.systemClipboard = { kind: 'text/plain', text };
      return { via: "document.execCommand('copy')（已废弃但兼容性好）", text };
    }
    log(2, '第 2 级失败：execCommand 返回 false → 回退到第 3 级');
  }

  // ---------- 第 3 级：手动兜底 ----------
  // 现代 UI 的常规做法：弹出一个只读输入框，内容自动全选，并提示"请按 Ctrl+C"。
  return { via: '手动兜底：把内容全选，请用户按 Ctrl+C', text };
}

console.log('三个环境各跑一次 copyText，观察它走到哪一级：');

// 环境 X：安全的 https 页面 + 手势 + 权限 —— 第 1 级就成功
{
  const env = new ClipboardEnv({ secureContext: true, userGesture: true, readPermission: 'granted', writePermission: 'granted' });
  const doc = createFakeDocument();
  console.log('');
  log(0, '环境 X：https + 用户手势 + clipboard-write 已授予');
  const r = await copyText('邀请码：ABC-123', { env, fakeDocument: doc });
  log(1, `最终通过：${r.via}`);
}

// 环境 Y：file:// 页面 —— 第 1 级不可用，回退到 execCommand
{
  const env = new ClipboardEnv({ secureContext: false, userGesture: true, readPermission: 'prompt', writePermission: 'granted' });
  const doc = createFakeDocument();
  console.log('');
  log(0, '环境 Y：file:// 页面（非安全上下文），但用户手势还在');
  const r = await copyText('邀请码：ABC-123', { env, fakeDocument: doc });
  log(1, `最终通过：${r.via}`);
  log(1, '注意：execCommand 必须在同步栈里调用，一旦中间有 await 就可能因手势过期而失败。');
}

// 环境 Z：连手势都没有 —— 只能手动兜底
{
  const env = new ClipboardEnv({ secureContext: false, userGesture: false, readPermission: 'denied', writePermission: 'granted' });
  const doc = createFakeDocument();
  console.log('');
  log(0, '环境 Z：非安全上下文 + 无用户手势（例如页面加载后 setTimeout 里执行）');
  const r = await copyText('邀请码：ABC-123', { env, fakeDocument: doc });
  log(1, `最终通过：${r.via}`);
  log(1, '这就是为什么"一键复制"必须绑在按钮的 click 上，不能放在自动执行的逻辑里。');
}

// ===========================================================================
// 第 4 部分：总结
// ===========================================================================

section('--- 4. 总结 ---');

console.log('拖放 API 的要点：');
console.log('  1) 事件顺序：dragstart → drag → dragenter → dragover → dragleave → drop → dragend');
console.log('  2) dragover 必须 preventDefault()，否则 drop 不会触发（头号坑）；');
console.log('  3) 只有在 dragstart 里能 setData；dragover 阶段处于"受保护模式"，getData 返回空；');
console.log('  4) dragover 里只能靠 dataTransfer.types 判断"拖的是什么"；');
console.log('  5) dragenter/dragleave 会因子元素而反复触发，用计数器或 relatedTarget 解决；');
console.log('  6) 用 effectAllowed / dropEffect 协商"复制 / 移动 / 链接"，它决定鼠标光标；');
console.log('  7) 拖入的文件在 dataTransfer.files 里，但拿不到本地完整路径。');

console.log('');
console.log('剪贴板 API 的要点：');
console.log('  1) 必须在「安全上下文 + 用户手势 + 权限授予」三者齐备时才能用；');
console.log('  2) 写入一般自动放行，读取几乎一定弹窗（剪贴板里可能是密码）；');
console.log('  3) 剪贴板里可能藏着密码 / 私钥 / 钱包地址，所以规范刻意把门槛设得很高；');
console.log('  4) 降级三级火箭：navigator.clipboard → execCommand(copy) → 手动全选提示用户；');
console.log('  5) 所有 await/异常都要 try/catch —— 用户拒绝授权是常态，不是异常情况。');

console.log('');
console.log('浏览器 vs Node 对照：');
console.log('  · DragEvent / DataTransfer / drop 概念  → Node 完全没有对应物；');
console.log('  · 剪贴板                                → Node 没有内置 API，只能靠');
console.log('    child_process 调用平台命令（clip.exe / pbcopy / xclip），不跨平台也不可靠；');
console.log('  · 本文件因此用「事件状态机 + 环境约束模拟」来演示规则本身，');
console.log('    这些规则（事件顺序、受保护模式、用户手势要求）在浏览器里是一模一样的。');
