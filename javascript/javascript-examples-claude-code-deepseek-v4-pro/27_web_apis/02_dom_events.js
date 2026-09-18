/**
 * ============================================================================
 * 知识点：DOM 事件（Node 端自建事件发射器，演示捕获 / 冒泡 / 委托 / 阻止默认）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/01_dom_query.js、06_functions/04_arrow_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    浏览器里的程序不是"从上跑到下"的流水线，而是"事件驱动"的：
 *    你注册一堆回调函数，等用户点击、输入、滚动时，浏览器再回头调用它们。
 *    事件的完整模型包含三件事：
 *      a) 注册：addEventListener(type, handler, options)
 *      b) 传播：一个事件从 window 一路"捕获"到目标元素，再从目标"冒泡"回 window
 *      c) 处理：沿途每个节点上注册的监听器，按各自的阶段被依次调用
 *
 * 2. 为什么需要
 *    如果每个按钮都单独绑事件，页面一复杂就是成百上千个监听器，内存和性能都受不了；
 *    而且动态新增的元素还得记得补绑。事件传播机制（尤其是"事件委托"）让
 *    父元素用一个监听器就能接管所有子元素的点击——这是前端最常用的优化手段之一。
 *
 * 3. 核心语法要点
 *    - addEventListener(type, handler, options)：options 可以是
 *        { capture: true }  在捕获阶段触发（默认 false = 冒泡阶段）
 *        { once: true }     只触发一次后自动移除
 *        { passive: true }  承诺不调用 preventDefault（滚动性能优化）
 *      也可以直接把第三个参数写成布尔值 true，等价于 { capture: true }。
 *    - 传播三阶段：捕获（1）→ 目标（2）→ 冒泡（3）。
 *      目标元素上的监听器无论 capture 是真是假，都在"目标阶段"触发。
 *    - event 对象关键属性：type、target（实际触发的元素）、
 *      currentTarget（当前正在执行监听器的元素）、eventPhase、defaultPrevented。
 *    - event.preventDefault()：阻止浏览器默认行为（链接跳转、表单提交、右键菜单）。
 *    - event.stopPropagation()：阻止事件继续传播（父元素收不到）。
 *    - event.stopImmediatePropagation()：连同一元素上的后续监听器也一并阻止。
 *    - 事件委托：把监听器注册在父元素上，用 event.target 判断"到底是谁被点了"，
 *      常配合 closest() 找到目标。
 *
 * 4. 常见陷阱
 *    - 传入的必须是函数本身：写 addEventListener('click', fn()) 会立刻执行 fn，
 *      把它的返回值当回调（通常是 undefined），事件永远不触发。
 *    - 同一个元素、同一类型、同一函数、同一 capture 值重复注册会被自动去重，
 *      不会触发两次。
 *    - 移除监听器必须传入与注册时"同一个函数引用"和"同一个 capture 值"，
 *      匿名函数注册的监听器无法移除。
 *    - stopPropagation 不会阻止"同一元素上其他监听器"的执行，
 *      要彻底截断得用 stopImmediatePropagation。
 *    - 浏览器中事件的 this 默认等于 currentTarget（箭头函数没有自己的 this，需注意）。
 *
 * 【本文件在 Node 中如何演示】
 *    Node.js 没有 DOM，也没有事件传播机制。Node 内置的 EventEmitter（node:events）
 *    只有"平铺的事件名 → 监听器列表"，没有树、没有捕获冒泡。
 *    所以本文件手工实现了一套最小的事件系统：用 parentNode 串成一棵树，
 *    dispatchEvent 时先算出传播路径，再依次跑捕获阶段、目标阶段、冒泡阶段。
 *    这套算法和浏览器内部做的事完全一致，只是没有渲染引擎而已。
 *
 * 【运行方法】
 *   node 27_web_apis/02_dom_events.js
 *
 * 【预期输出】
 *   打印事件在 root → div → button 三层节点上的传播顺序、
 *   阻止冒泡 / 阻止默认行为 / stopImmediatePropagation / once 的效果，
 *   以及"事件委托"用 1 个监听器处理 3 个按钮的过程。
 * ============================================================================
 */

// ===========================================================================
// 第 0 部分：实现最小事件系统
// ===========================================================================

/** 事件阶段常量，数值与浏览器 Event 接口保持一致 */
const CAPTURING_PHASE = 1;
const AT_TARGET = 2;
const BUBBLING_PHASE = 3;

/** 事件对象，模拟浏览器的 Event 接口 */
class Event {
  /**
   * @param {string} type 事件类型，如 'click'
   * @param {{bubbles?: boolean, cancelable?: boolean}} [init] 初始化配置
   */
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = init.bubbles !== false; // 默认冒泡
    this.cancelable = init.cancelable !== false; // 默认可取消
    this.target = null; // 实际派发事件的元素（传播过程中不变）
    this.currentTarget = null; // 当前正在执行监听器的元素（会变）
    this.eventPhase = 0; // 当前处于哪个阶段
    this.defaultPrevented = false; // 是否已被 preventDefault
    this._propagationStopped = false; // 是否已 stopPropagation
    this._immediateStopped = false; // 是否已 stopImmediatePropagation
  }

  /** 阻止浏览器默认行为（比如链接跳转、表单提交） */
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }

  /** 阻止事件继续向上（或向下）传播，但同元素上的其它监听器仍会执行 */
  stopPropagation() {
    this._propagationStopped = true;
  }

  /** 更彻底：连同元素上"后注册"的监听器也一起阻止 */
  stopImmediatePropagation() {
    this._propagationStopped = true;
    this._immediateStopped = true;
  }
}

/** 可接受事件的节点，模拟浏览器的 EventTarget 接口 */
class EventTarget {
  constructor(name) {
    this.nodeName = name; // 便于日志阅读
    this.parentNode = null; // 父节点，用于构建传播路径
    this._listeners = new Map(); // Map<事件类型, 监听器记录数组>
  }

  /**
   * 注册事件监听器。
   * @param {string} type 事件类型
   * @param {Function} handler 回调函数
   * @param {boolean|{capture?: boolean, once?: boolean}} [options] 配置
   */
  addEventListener(type, handler, options = {}) {
    // 允许第三个参数写成布尔值，等价于 { capture: bool }
    const opts = typeof options === 'boolean' ? { capture: options } : options;
    const capture = Boolean(opts.capture);
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    const list = this._listeners.get(type);
    // 真实 DOM 会去重：同一函数 + 同一 capture 值 + 同一类型，只算一次
    if (list.some((l) => l.handler === handler && l.capture === capture)) return;
    list.push({ handler, capture, once: Boolean(opts.once) });
  }

  /** 移除监听器：必须传入与注册时相同的函数引用和相同的 capture 值 */
  removeEventListener(type, handler, options = {}) {
    const opts = typeof options === 'boolean' ? { capture: options } : options;
    const capture = Boolean(opts.capture);
    const list = this._listeners.get(type);
    if (!list) return;
    const i = list.findIndex((l) => l.handler === handler && l.capture === capture);
    if (i !== -1) list.splice(i, 1);
  }

  /** 派发事件：返回 false 表示默认行为被取消了（与浏览器一致） */
  dispatchEvent(event) {
    // 1) 构建传播路径：从目标一路向上到根 [target, parent, ..., root]
    const path = [];
    for (let node = this; node; node = node.parentNode) path.push(node);

    event.target = this;

    // 2) 捕获阶段：从根开始往下，直到目标的"父节点"为止
    for (let i = path.length - 1; i >= 1; i--) {
      runListeners(path[i], event, CAPTURING_PHASE);
      if (event._propagationStopped) return !event.defaultPrevented;
    }

    // 3) 目标阶段：目标元素上注册的监听器全部执行（capture 真假都在此阶段）
    runListeners(this, event, AT_TARGET);
    if (event._propagationStopped) return !event.defaultPrevented;

    // 4) 冒泡阶段：从目标的父节点一路向上（不冒泡的事件到此结束）
    if (event.bubbles) {
      for (let i = 1; i < path.length; i++) {
        runListeners(path[i], event, BUBBLING_PHASE);
        if (event._propagationStopped) return !event.defaultPrevented;
      }
    }

    return !event.defaultPrevented;
  }

  /** 模拟 CSS 选择器匹配中常用的 closest：向上找最近的满足条件的祖先 */
  closest(predicate) {
    let node = this;
    while (node) {
      if (predicate(node)) return node;
      node = node.parentNode;
    }
    return null;
  }
}

/** 在指定节点上执行该阶段允许的监听器 */
function runListeners(node, event, phase) {
  const list = node._listeners.get(event.type);
  if (!list || list.length === 0) return;

  // 复制一份再遍历：监听器内部可能增删监听器（once 也会改这个数组）
  for (const record of list.slice()) {
    // 捕获阶段只跑 capture 监听器；冒泡阶段只跑非 capture 监听器；目标阶段全跑
    if (phase === CAPTURING_PHASE && !record.capture) continue;
    if (phase === BUBBLING_PHASE && record.capture) continue;

    if (record.once) node.removeEventListener(event.type, record.handler, { capture: record.capture });

    event.currentTarget = node;
    event.eventPhase = phase;
    // 真实 DOM 中，普通函数里的 this 指向 currentTarget
    record.handler.call(node, event);

    if (event._immediateStopped) return;
  }
}

/** 阶段名，仅用于日志 */
const PHASE_NAME = { [CAPTURING_PHASE]: '捕获', [AT_TARGET]: '目标', [BUBBLING_PHASE]: '冒泡' };

// ===========================================================================
// 第 1 部分：搭一棵三层节点树
// ===========================================================================

console.log('--- 1. 构建三层节点树：root > div > button ---');

const root = new EventTarget('root');
const div = new EventTarget('div');
const button = new EventTarget('button');
div.parentNode = root;
button.parentNode = div;

console.log('树结构： root > div > button（button 在最深处，是事件目标）');
console.log('');

// ===========================================================================
// 第 2 部分：捕获与冒泡的传播顺序
// ===========================================================================

console.log('--- 2. 一次点击，事件跑遍全树：捕获 → 目标 → 冒泡 ---');

/** 注册一个打印用的监听器，返回函数引用（方便后面移除） */
function trace(node, capture) {
  const handler = (e) => {
    const where = PHASE_NAME[e.eventPhase];
    console.log(`  [${where}] ${node.nodeName} 上的监听器执行（capture=${capture}, currentTarget=${e.currentTarget.nodeName}）`);
  };
  node.addEventListener('click', handler, { capture });
  return handler;
}

// 每个节点都注册"捕获"和"冒泡"两个监听器
const traces = [trace(root, true), trace(root, false), trace(div, true), trace(div, false), trace(button, true), trace(button, false)];

console.log('在 button 上派发 click 事件：');
button.dispatchEvent(new Event('click'));
console.log('');
console.log('规律：捕获阶段从外往里（root→div），目标阶段执行 button 自己的监听器，');
console.log('      冒泡阶段再从里往外（div→root）。这就是"事件先捕获后冒泡"的完整顺序。');
console.log('');

// ===========================================================================
// 第 3 部分：target 与 currentTarget 的区别
// ===========================================================================

console.log('--- 3. target 与 currentTarget：一个不变，一个随传播变化 ---');

div.addEventListener(
  'click',
  // 注意这里用普通函数而不是箭头函数：箭头函数没有自己的 this，
  // 普通函数里的 this 才会被绑定成 currentTarget（浏览器中同样如此）。
  function (e) {
    console.log('  在 div 的监听器里：');
    console.log('    event.target        =', e.target.nodeName, '（实际被点的元素，全程不变）');
    console.log('    event.currentTarget =', e.currentTarget.nodeName, '（当前执行监听器的元素，会变）');
    console.log('    this                =', this.nodeName, '（普通函数中 this === currentTarget）');
  },
  { once: true },
);
button.dispatchEvent(new Event('click'));

// 把上面这些"演示用"的监听器移除掉，否则后面每一节都会被打扰。
// 移除时必须传入**同一个函数引用**和**相同的 capture 值**，这正是下面的注意事项。
const targets = [root, div, button];
traces.forEach((handler, i) => targets[Math.floor(i / 2)].removeEventListener('click', handler, { capture: i % 2 === 0 }));
console.log('  （已用 removeEventListener 移除上面 6 个演示监听器，后续输出更清爽）');
console.log('');

// ===========================================================================
// 第 4 部分：stopPropagation 与 stopImmediatePropagation
// ===========================================================================

console.log('--- 4. stopPropagation：把事件"截"在某一层 ---');

const rootSpy = () => console.log('  root 的冒泡监听器执行了（说明事件冒到了 root）');
root.addEventListener('click', rootSpy, { once: true });

div.addEventListener(
  'click',
  (e) => {
    e.stopPropagation(); // 阻止继续冒泡
    console.log('  div 的监听器执行并调用 stopPropagation()，事件不再往上传给 root');
  },
  { once: true },
);
button.dispatchEvent(new Event('click'));
console.log('  （上面没有出现 root 的日志，说明冒泡被截断了。）');
console.log('');

console.log('--- 5. stopImmediatePropagation：连同一元素上后面的监听器也拦掉 ---');

const nodeA = new EventTarget('nodeA');
nodeA.addEventListener('click', (e) => {
  e.stopImmediatePropagation();
  console.log('  nodeA 的第 1 个监听器：调用 stopImmediatePropagation()');
});
nodeA.addEventListener('click', () => {
  console.log('  nodeA 的第 2 个监听器：这行不会打印，因为它被立即阻止了');
});
nodeA.dispatchEvent(new Event('click'));
console.log('  对比：若用 stopPropagation()，第 2 个监听器仍然会执行。');
console.log('');

// ===========================================================================
// 第 5 部分：preventDefault 阻止默认行为
// ===========================================================================

console.log('--- 6. preventDefault：阻止浏览器默认动作 ---');

// 模拟"浏览器默认行为"：比如点 <a> 会跳转、点提交按钮会提交表单。
// 它在事件派发结束之后由浏览器执行，检查的正是 event.defaultPrevented。
function simulateBrowserDefault(event, what) {
  if (event.defaultPrevented) {
    console.log('  浏览器看到 defaultPrevented = true，于是放弃默认行为：' + what);
  } else {
    console.log('  浏览器执行默认行为：' + what);
  }
}

const link = new EventTarget('link');
link.parentNode = root;

// 情形 A：不调用 preventDefault
console.log('A) 监听器里什么都不做：');
link.addEventListener('click', () => console.log('  link 的监听器执行（没有 preventDefault）'), { once: true });
const evtA = new Event('click');
link.dispatchEvent(evtA);
simulateBrowserDefault(evtA, '跳转到链接地址');

// 情形 B：调用 preventDefault
console.log('B) 监听器里调用 preventDefault()：');
link.addEventListener(
  'click',
  (e) => {
    e.preventDefault();
    console.log('  link 的监听器执行并调用 preventDefault()，defaultPrevented =', e.defaultPrevented);
  },
  { once: true },
);
const evtB = new Event('click');
const notCanceled = link.dispatchEvent(evtB);
console.log('  dispatchEvent 的返回值 =', notCanceled, '（false 表示默认行为已被取消）');
simulateBrowserDefault(evtB, '跳转到链接地址');
console.log('');

// ===========================================================================
// 第 6 部分：once 与 removeEventListener
// ===========================================================================

console.log('--- 7. once 选项：只触发一次的监听器 ---');

const oneShot = new EventTarget('oneShot');
let times = 0;
oneShot.addEventListener(
  'ping',
  () => {
    times += 1;
    console.log('  第 ' + times + ' 次收到 ping（我只会被触发一次）');
  },
  { once: true },
);
oneShot.dispatchEvent(new Event('ping'));
oneShot.dispatchEvent(new Event('ping'));
oneShot.dispatchEvent(new Event('ping'));
console.log('  派发了 3 次，实际触发次数 =', times);
console.log('');

console.log('--- 8. removeEventListener：必须传同一个函数引用 ---');

const box = new EventTarget('box');
function onBoxClick() {
  console.log('  onBoxClick 被调用');
}
box.addEventListener('click', onBoxClick);
box.dispatchEvent(new Event('click'));
box.removeEventListener('click', onBoxClick); // 传入同一个函数引用才有效
box.dispatchEvent(new Event('click'));
console.log('  移除后再派发，监听器没有被调用。');
console.log('  陷阱：如果注册时用的是匿名函数，就无法移除——因为拿不到那个引用了。');
console.log('');

// ===========================================================================
// 第 7 部分：事件委托（最重要的一节）
// ===========================================================================

console.log('--- 9. 事件委托：1 个监听器管 3 个按钮 ---');

// 模拟一个工具栏：toolbar 下有 3 个按钮，按钮上带 data-action 自定义属性
const toolbar = new EventTarget('toolbar');
toolbar.parentNode = root;

/** 造一个带 dataset 的按钮节点（模拟 <button data-action="save">） */
function makeButton(action) {
  const b = new EventTarget('button');
  b.parentNode = toolbar;
  b.dataset = { action }; // 模拟元素的 dataset（data-* 属性映射）
  return b;
}

const buttons = [makeButton('save'), makeButton('delete'), makeButton('share')];
const handlers = {
  save: () => console.log('    执行保存逻辑'),
  delete: () => console.log('    执行删除逻辑'),
  share: () => console.log('    执行分享逻辑'),
};

// 只在父元素 toolbar 上注册 1 个监听器（这就是事件委托）
toolbar.addEventListener('click', (e) => {
  // e.target 是真正被点击的那个按钮（即使在子元素里也能通过 closest 上溯）
  const btn = e.target.closest((node) => node.dataset && node.dataset.action);
  if (!btn) return; // 点的不是按钮，直接忽略
  console.log('  toolbar 收到冒泡上来的点击，target =', e.target.nodeName, '，data-action =', btn.dataset.action);
  handlers[btn.dataset.action]();
});

for (const b of buttons) {
  console.log('  点击 data-action="' + b.dataset.action + '" 的按钮：');
  b.dispatchEvent(new Event('click'));
}
console.log('');
console.log('  委托的好处：只需 1 个监听器；后新增的按钮自动享有同样的事件处理，无需补绑。');

// 动态新增的按钮照样能工作
const lateBtn = makeButton('save');
console.log('  动态新增的第 4 个按钮（data-action="save"）：');
lateBtn.dispatchEvent(new Event('click'));
console.log('');

// ===========================================================================
// 第 8 部分：与 Node 内置 events 模块的对比
// ===========================================================================

console.log('--- 10. 顺带一提：Node 内置的 EventEmitter 是"扁平"的 ---');
console.log('  node:events 的 EventEmitter 只有事件名 → 监听器列表的映射，');
console.log('  没有父节点、没有捕获/冒泡、没有 currentTarget，因此无法实现事件委托。');
console.log('  本文件手写的这套结构，正是浏览器 DOM 事件模型的核心。');
console.log('');
console.log('程序结束。');
