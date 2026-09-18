/**
 * ============================================================================
 * 知识点：三大观察者 —— IntersectionObserver / MutationObserver / ResizeObserver
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/01_dom_query.js（DOM 树与遍历）、
 *             27_web_apis/02_dom_events.js（事件与异步回调）、
 *             17_async/01_callbacks.js（回调、微任务）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    观察者模式（Observer Pattern）在浏览器里被做成了三个原生 API。
 *    它们的共同特征是：**你把一个回调注册给浏览器，浏览器在合适的时机替你去检查**，
 *    而不是你自己写定时器轮询。
 *      - IntersectionObserver：观察「元素与视口（或某个祖先）的相交情况」。
 *      - MutationObserver：观察「DOM 树本身的变化」（节点增删、属性改动、文本改动）。
 *      - ResizeObserver：观察「元素盒子尺寸的变化」。
 *
 * 2. 为什么需要（以及不用它们有多痛）
 *    - 懒加载图片 / 无限滚动：老办法是监听 scroll 事件，每次滚动都调用
 *      getBoundingClientRect()。滚动一秒能触发上百次，每次都强制浏览器做布局计算
 *      （强制同步布局 / layout thrashing），页面直接卡死。
 *      IntersectionObserver 把这些计算搬进了浏览器的渲染管线内部，只在
 *      「相交状态真的变化了」时回调一次，性能高一个数量级。
 *    - 监听 DOM 变化：老办法是 Mutation Events（DOMNodeInserted 等），它们是同步的、
 *      会严重拖慢每次 DOM 操作，已被废弃。MutationObserver 是异步批量投递的替代品。
 *    - 监听尺寸变化：老办法是 window.onresize + 轮询，既抓不到非窗口引起的变化
 *      （比如内容变多把盒子撑大），又费性能。ResizeObserver 能精确捕捉每个元素。
 *
 * 3. 核心语法要点
 *    三者的 API 形状几乎一样：
 *      const ob = new XxxObserver(callback, options?);
 *      ob.observe(target);
 *      ob.unobserve(target);
 *      ob.disconnect();
 *      ob.takeRecords();     // 取出尚未投递的记录（取走后不会再触发回调）
 *
 *    - IntersectionObserver 的回调收到 (entries, observer)。每条 entry 有：
 *        target / isIntersecting / intersectionRatio / boundingClientRect /
 *        intersectionRect / rootBounds / time
 *      options：{ root（祖先容器，默认视口）、rootMargin（提前/延后触发的"外扩"）、
 *                 threshold（触发阈值数组，如 [0, 0.5, 1]） }
 *    - MutationObserver 的回调收到 (records, observer)。每条 record 有：
 *        type（'childList' | 'attributes' | 'characterData'）、target、
 *        addedNodes / removedNodes（childList）、attributeName / oldValue（attributes）、 *        oldValue（characterData）
 *      options：{ childList, attributes, characterData, subtree,
 *                 attributeOldValue, characterDataOldValue, attributeFilter }
 *    - ResizeObserver 的回调收到 (entries, observer)。每条 entry 有：
 *        target / contentRect / borderBoxSize / contentBoxSize / devicePixelContentBoxSize
 *
 * 4. 投递时机（最容易搞错的地方）
 *    - MutationObserver：**微任务**。当前同步代码跑完立刻投递，比 setTimeout 早。
 *    - IntersectionObserver / ResizeObserver：**渲染前的"更新渲染"步骤**，
 *      同一帧内多次变化会被合并成一次回调。所以"滚动后立刻读结果"是读不到的。
 *
 * 5. 常见陷阱
 *    - 在 IntersectionObserver 回调里直接改 DOM 导致再次相交 → 死循环。
 *    - ResizeObserver 回调里改变被观察元素自身的尺寸 → 浏览器报
 *      "ResizeObserver loop completed with undelivered notifications"。
 *      解决办法：把改动放进 requestAnimationFrame，或用 CSS 规避。
 *    - MutationObserver 的 subtree:true 会观察整棵子树，改动频繁时回调会非常频繁，
 *      需要自己节流。
 *    - 观察者会持有 target 的强引用（除非用 WeakRef 语义的变体），
 *      组件销毁时记得 unobserve / disconnect，否则元素无法回收 → 内存泄漏。
 *    - thresholds 为空数组是合法的（等价于 [0]）；rootMargin 只接受 px 和 %。
 *
 * 【本文件在 Node 中如何演示】
 *   Node.js 里没有 DOM，也没有这三个观察者。本文件用一个「回调注册表 +
 *   手动触发」的模型把它们**完整模拟**出来：
 *     - 用 FakeElement / FakeText 搭一棵迷你 DOM（参考 01_dom_query.js）；
 *     - 给这棵 DOM 挂上一个「变更广播」，MutationObserver 借此收到记录；
 *     - 用一个假的视口（scrollY + height）和元素布局坐标，
 *       手写 IntersectionObserver 的相交比例与阈值判定算法；
 *     - 用 setSize() 手动改尺寸来驱动 ResizeObserver。
 *   重点在于**把三个观察者的投递时机、批量合并、takeRecords 语义讲清楚**，
 *   这些行为在浏览器和本文件里是一致的。真实的计算（布局、绘制）由浏览器
 *   C++ 侧完成，本文件用几行算术代替。
 *
 * 【运行方法】
 *   node 27_web_apis/12_observer_apis.js
 *
 * 【预期输出】
 *   四个演示段落：IntersectionObserver 做图片懒加载、做无限滚动；
 *   MutationObserver 批量捕获节点/属性/文本三类变化；
 *   ResizeObserver 捕获尺寸变化并解释"循环"报错。
 *   每一段都会打印回调被触发的时刻与收到的记录内容。
 * ============================================================================
 */

// ===========================================================================
// 第 0 部分：搭一棵"会广播变化"的迷你 DOM
// ===========================================================================
// 与 01_dom_query.js 的 Element 相比，这里多了两件事：
//   1. 每个元素带一个 layout（文档坐标下的 top/height），用来做相交计算；
//   2. 所有会改变树或属性的方法，都会调用 notifyMutation() 广播一条变更记录。
//      MutationObserver 就是靠这个广播工作的。

/** 全局的变更广播中心：所有 MutationObserver 实例都在这里登记 */
const mutationObservers = new Set();

/**
 * 广播一条 DOM 变更记录。
 * 真实浏览器里这是 C++ 引擎内部的行为，我们只能"手动"在改 DOM 的方法里调用它。
 * @param {{type:string, target:object, addedNodes?:Array, removedNodes?:Array,
 *          attributeName?:string|null, oldValue?:string|null}} record
 */
function notifyMutation(record) {
  // 补齐缺省字段，让记录形状统一
  const full = {
    type: record.type,
    target: record.target,
    addedNodes: record.addedNodes || [],
    removedNodes: record.removedNodes || [],
    attributeName: record.attributeName ?? null,
    attributeNamespace: null,
    oldValue: record.oldValue ?? null,
    previousSibling: null,
    nextSibling: null,
  };

  // 对每个观察者，逐个检查它注册的 (target, options) 是否关心这条记录
  for (const mo of mutationObservers) {
    mo._enqueueIfInterested(full);
  }
}

/** target 是否是 ancestor 的后代（含自身） */
function isDescendantOrSelf(target, ancestor) {
  let n = target;
  while (n) {
    if (n === ancestor) return true;
    n = n.parentNode;
  }
  return false;
}

// ---------------------------------------------------------------------------
// 文本节点
// ---------------------------------------------------------------------------

class FakeText {
  constructor(data) {
    this.nodeType = 3; // 3 = TEXT_NODE
    this.nodeName = '#text';
    this.parentNode = null;
    this._data = String(data);
  }

  get data() {
    return this._data;
  }

  /**
   * 修改文本内容会产生一条 type:'characterData' 的记录，
   * oldValue 只有在 options.characterDataOldValue === true 时才会被真正记录。
   */
  set data(value) {
    const old = this._data;
    this._data = String(value);
    notifyMutation({ type: 'characterData', target: this, oldValue: old });
  }

  get textContent() {
    return this._data;
  }

  set textContent(value) {
    this.data = value; // 简化：直接复用 data 的 setter
  }
}

// ---------------------------------------------------------------------------
// 元素节点
// ---------------------------------------------------------------------------

class FakeElement {
  /**
   * @param {string} tagName 标签名
   * @param {object} [layout] 布局信息 { top, height }（文档坐标系，单位 px）
   */
  constructor(tagName, layout) {
    this.nodeType = 1; // 1 = ELEMENT_NODE
    this.tagName = tagName.toUpperCase();
    this.nodeName = this.tagName;
    this.childNodes = [];
    this.parentNode = null;
    this.attributes = new Map(); // 属性表
    this.className = ''; // 便于打印
    // 真实 DOM 里这是浏览器布局引擎算出来的；这里手动设定，方便演示
    this.layout = layout || { top: 0, height: 0 };
    this._resizeObservers = new Set(); // 谁在观察我的尺寸
  }

  // ---- 属性读写（都会广播 attributes 变更） ----

  setAttribute(name, value) {
    const old = this.attributes.has(name) ? this.attributes.get(name) : null;
    this.attributes.set(name, String(value));
    notifyMutation({ type: 'attributes', target: this, attributeName: name, oldValue: old });
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  removeAttribute(name) {
    if (!this.attributes.has(name)) return;
    const old = this.attributes.get(name);
    this.attributes.delete(name);
    notifyMutation({ type: 'attributes', target: this, attributeName: name, oldValue: old });
  }

  /** firstChild：第一个子节点（可能是元素，也可能是文本节点） */
  get firstChild() {
    return this.childNodes[0] || null;
  }

  /** children：真实 DOM 里只算元素子节点；这里简化成与 childNodes 相同 */
  get children() {
    return this.childNodes;
  }

  // ---- 内容读写 ----

  /** textContent：把所有后代文本拼起来（与真实 DOM 一致） */
  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }

  /**
   * 给 textContent 赋值 = 清空所有子节点 + 插入一个文本节点。
   * 这在 MutationObserver 眼里是**一次 childList 变更**（同时有移除和新增），
   * 而不是"文本变了"——这是个非常常见的误解。
   */
  set textContent(value) {
    const removed = this.childNodes.slice();
    for (const c of removed) c.parentNode = null;
    this.childNodes = [];
    const str = String(value);
    const added = [];
    if (str !== '') {
      const t = new FakeText(str);
      t.parentNode = this;
      this.childNodes.push(t);
      added.push(t);
    }
    if (removed.length > 0 || added.length > 0) {
      notifyMutation({ type: 'childList', target: this, addedNodes: added, removedNodes: removed });
    }
  }

  // ---- 结构操作（都会广播 childList 变更） ----

  appendChild(node) {
    if (node.parentNode) node.parentNode.removeChild(node); // 同一节点只能有一个父节点
    node.parentNode = this;
    this.childNodes.push(node);
    notifyMutation({ type: 'childList', target: this, addedNodes: [node], removedNodes: [] });
    return node;
  }

  insertBefore(node, ref) {
    if (ref == null) return this.appendChild(node);
    const i = this.childNodes.indexOf(ref);
    if (i === -1) throw new Error('insertBefore: 参照节点不是本节点的子节点');
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.splice(i, 0, node);
    notifyMutation({ type: 'childList', target: this, addedNodes: [node], removedNodes: [] });
    return node;
  }

  removeChild(node) {
    const i = this.childNodes.indexOf(node);
    if (i === -1) throw new Error('removeChild: 该节点不是本节点的子节点');
    this.childNodes.splice(i, 1);
    node.parentNode = null;
    notifyMutation({ type: 'childList', target: this, addedNodes: [], removedNodes: [node] });
    return node;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  // ---- 尺寸（ResizeObserver 的驱动入口） ----

  /**
   * 手动改变元素尺寸。
   * 真实浏览器里尺寸是布局引擎算出来的；这里我们显式调用它来"制造一次布局变化"，
   * 它会通知所有观察本元素的 ResizeObserver。
   */
  setSize(width, height) {
    const oldW = this.layout.width || 0;
    const oldH = this.layout.height || 0;
    if (oldW === width && oldH === height) return; // 尺寸没变就不触发（真实实现也是如此）
    this.layout.width = width;
    this.layout.height = height;
    for (const ro of this._resizeObservers) {
      // 注意：ResizeObserver 观察的是 content box 的宽高
      ro._enqueue({
        target: this,
        contentRect: { x: 0, y: 0, top: 0, left: 0, width, height, bottom: height, right: width },
        borderBoxSize: [{ inlineSize: width, blockSize: height }],
        contentBoxSize: [{ inlineSize: width, blockSize: height }],
        devicePixelContentBoxSize: [{ inlineSize: width, blockSize: height }],
      });
    }
  }

  /** 可读短名，用于日志 */
  describe() {
    const id = this.getAttribute('id');
    const cls = this.className ? '.' + this.className.split(/\s+/).join('.') : '';
    return this.tagName.toLowerCase() + (id ? '#' + id : '') + cls;
  }
}

// ===========================================================================
// 第 1 部分：IntersectionObserver —— 元素可见性监测
// ===========================================================================

/**
 * 模拟的"渲染管线"。
 * 真实浏览器每一帧都会重新做布局并检查所有 IntersectionObserver，
 * 这里用一个显式的 render(viewport) 调用来代表"渲染了一帧"。
 */
class FakeViewport {
  constructor(height) {
    this.scrollY = 0; // 当前滚动位置（文档坐标）
    this.height = height; // 视口高度
  }

  /** 视口在文档坐标系里的范围（不含 rootMargin） */
  get rootBounds() {
    return { top: this.scrollY, bottom: this.scrollY + this.height, left: 0, right: 1000 };
  }

  /** 滚动到指定位置，然后跑一次"渲染帧" */
  scrollTo(y) {
    this.scrollY = y;
    renderFrame(this);
  }
}

/** 所有活着的 IntersectionObserver（模拟浏览器内部的注册表） */
const intersectionObservers = new Set();

/**
 * 跑一帧渲染：让每个 IntersectionObserver 重新计算自己所有目标的相交状态，
 * 把状态发生变化的记录放进队列，最后统一投递（这就是"一帧合并成一次回调"）。
 */
function renderFrame(viewport) {
  for (const io of intersectionObservers) io._recompute(viewport);
  // 每帧结束时统一投递（对应浏览器"更新渲染"步骤里的投递）
  for (const io of intersectionObservers) io._deliver();
  // ResizeObserver 同理：真实浏览器在渲染前检查尺寸变化
  for (const ro of resizeObservers) ro._deliver();
}

/** 把 "10px" / "20%" 这样的 rootMargin 值解析成像素 */
function parseMarginValue(text, base) {
  const s = String(text).trim();
  if (s.endsWith('%')) return (parseFloat(s) / 100) * base;
  return parseFloat(s) || 0;
}

/** 解析 rootMargin："10px 20px 30px 40px"，与 CSS margin 一样支持 1/2/3/4 个值 */
function parseRootMargin(margin, viewportHeight) {
  const parts = String(margin || '0px').trim().split(/\s+/);
  let top, right, bottom, left;
  if (parts.length === 1) [top, right, bottom, left] = [parts[0], parts[0], parts[0], parts[0]];
  else if (parts.length === 2) [top, right, bottom, left] = [parts[0], parts[1], parts[0], parts[1]];
  else if (parts.length === 3) [top, right, bottom, left] = [parts[0], parts[1], parts[2], parts[1]];
  else [top, right, bottom, left] = [parts[0], parts[1], parts[2], parts[3]];
  return {
    top: parseMarginValue(top, viewportHeight),
    right: parseMarginValue(right, viewportHeight),
    bottom: parseMarginValue(bottom, viewportHeight),
    left: parseMarginValue(left, viewportHeight),
  };
}

class IntersectionObserver {
  /**
   * @param {Function} callback 相交状态变化时被调用，签名 (entries, observer)
   * @param {object} [options] { root, rootMargin, threshold }
   */
  constructor(callback, options = {}) {
    this.callback = callback;
    this.root = options.root || null; // null = 视口
    this.rootMargin = options.rootMargin || '0px';
    this.thresholds = (options.threshold === undefined ? [0] : [].concat(options.threshold)).slice().sort((a, b) => a - b);
    if (this.thresholds.length === 0) this.thresholds = [0];
    this._targets = new Map(); // target → 上一次的"阈值档位"（用于判断状态是否变化）
    this._queue = []; // 待投递的记录
    intersectionObservers.add(this); // 注册到"浏览器"里
  }

  observe(target) {
    if (!this._targets.has(target)) {
      // 首次观察时先记录一个"不可能"的档位（NaN），保证第一次渲染一定会触发回调。
      // 真实规范里也是"observe 之后立刻排队一条初始记录"。
      this._targets.set(target, NaN);
    }
  }

  unobserve(target) {
    this._targets.delete(target);
  }

  disconnect() {
    this._targets.clear();
    this._queue = [];
    intersectionObservers.delete(this);
  }

  /** 取出尚未投递的记录（取走后不再触发回调） */
  takeRecords() {
    return this._queue.splice(0, this._queue.length);
  }

  /**
   * 核心算法：算出 target 与 root（这里简化成视口）的相交比例，
   * 换算出"阈值档位"，只有档位变了才产生一条记录。
   */
  _recompute(viewport) {
    const rootBounds = viewport.rootBounds;
    const margin = parseRootMargin(this.rootMargin, viewport.height);
    // rootMargin 是"把根盒子的四边向外扩"，正数代表提前触发
    const expandedTop = rootBounds.top - margin.top;
    const expandedBottom = rootBounds.bottom + margin.bottom;

    for (const [target, lastBucket] of this._targets) {
      const rect = {
        top: target.layout.top,
        bottom: target.layout.top + target.layout.height,
        left: 0,
        right: 1000,
        height: target.layout.height,
        width: 1000,
      };

      // 相交区域 = 两个矩形的重叠部分
      const interTop = Math.max(rect.top, expandedTop);
      const interBottom = Math.min(rect.bottom, expandedBottom);
      const interHeight = Math.max(0, interBottom - interTop);
      const isIntersecting = interHeight > 0;
      // 相交比例：相交高度 / 自身高度（真实实现还要除以根盒子面积取小值，这里简化）
      const ratio = rect.height > 0 ? Math.min(1, interHeight / rect.height) : isIntersecting ? 1 : 0;

      // 把比例换算成"档位"：比例 0 → -1；否则是"达到了几个阈值"
      // 用档位（而不是直接用比例）比较，就自然实现了"只在跨过阈值时才回调"
      const bucket = ratio === 0 ? -1 : this.thresholds.filter((t) => ratio >= t).length;

      if (bucket !== lastBucket) {
        this._targets.set(target, bucket);
        this._queue.push({
          target,
          isIntersecting,
          intersectionRatio: Number(ratio.toFixed(3)),
          boundingClientRect: rect,
          intersectionRect: { top: interTop, bottom: interBottom, height: interHeight },
          rootBounds: { top: expandedTop, bottom: expandedBottom },
          time: 0, // 真实 API 里是相对于页面加载的高精度时间戳
        });
      }
    }
  }

  /** 投递：把队列里的记录一次性交给回调（可能一次给多条） */
  _deliver() {
    if (this._queue.length === 0) return;
    const entries = this.takeRecords();
    this.callback(entries, this);
  }
}

// ===========================================================================
// 第 2 部分：MutationObserver —— DOM 变化监测
// ===========================================================================

class MutationObserver {
  /**
   * @param {Function} callback 签名 (records, observer)
   */
  constructor(callback) {
    this.callback = callback;
    this._registrations = []; // [{ target, options }]
    this._queue = [];
    this._scheduled = false;
    mutationObservers.add(this); // 注册到全局广播中心
  }

  /**
   * @param {object} target 被观察的节点
   * @param {object} options {
   *   childList, attributes, characterData, subtree,
   *   attributeOldValue, characterDataOldValue, attributeFilter
   * }
   */
  observe(target, options = {}) {
    const opts = {
      childList: !!options.childList,
      attributes: options.attributes === undefined && !options.childList && !options.characterData
        ? true // 一个都不写时默认观察 attributes（与真实规范一致）
        : !!options.attributes,
      characterData: !!options.characterData,
      subtree: !!options.subtree,
      attributeOldValue: !!options.attributeOldValue,
      characterDataOldValue: !!options.characterDataOldValue,
      attributeFilter: options.attributeFilter || null,
    };
    this._registrations.push({ target, options: opts });
  }

  unobserve() {
    // 注意：真实的 MutationObserver 没有 unobserve()，只能 disconnect()。
    // 这里保留一个空实现只为提醒这一点，不要在生产代码里调用它。
    throw new Error('MutationObserver 没有 unobserve()，请使用 disconnect()');
  }

  disconnect() {
    this._registrations = [];
    this._queue = [];
    mutationObservers.delete(this);
  }

  takeRecords() {
    const out = this._queue.splice(0, this._queue.length);
    return out;
  }

  /**
   * 由 notifyMutation 调用：判断这条记录是否被本观察者关心，
   * 关心就入队，并按"微任务"投递（这正是浏览器里的时机）。
   */
  _enqueueIfInterested(record) {
    for (const { target, options } of this._registrations) {
      if (!this._matchType(record, options)) continue;

      const sameNode = record.target === target;
      const inSubtree = options.subtree && isDescendantOrSelf(record.target, target);
      if (!sameNode && !inSubtree) continue;

      // 同一个观察者不会对同一条记录重复入队
      if (this._queue.includes(record)) continue;

      // 按需裁剪记录：不要 oldValue 就抹掉，省内存
      const copy = {
        type: record.type,
        target: record.target,
        addedNodes: record.addedNodes,
        removedNodes: record.removedNodes,
        attributeName: record.attributeName,
        attributeNamespace: record.attributeNamespace,
        previousSibling: record.previousSibling,
        nextSibling: record.nextSibling,
        oldValue: this._wantOldValue(record, options) ? record.oldValue : null,
      };
      this._queue.push(copy);
      this._scheduleDeliver();
      return; // 一条记录对一个观察者只入队一次
    }
  }

  /** 类型与过滤器是否匹配 */
  _matchType(record, options) {
    if (record.type === 'childList') return options.childList;
    if (record.type === 'attributes') {
      if (!options.attributes) return false;
      if (options.attributeFilter && !options.attributeFilter.includes(record.attributeName)) return false;
      return true;
    }
    if (record.type === 'characterData') return options.characterData;
    return false;
  }

  _wantOldValue(record, options) {
    if (record.type === 'attributes') return options.attributeOldValue;
    if (record.type === 'characterData') return options.characterDataOldValue;
    return false;
  }

  /** 用微任务投递：当前同步代码一跑完就回调，比 setTimeout 早 */
  _scheduleDeliver() {
    if (this._scheduled) return; // 一批变更只投递一次（批量合并）
    this._scheduled = true;
    queueMicrotask(() => {
      this._scheduled = false;
      if (this._queue.length === 0) return;
      const records = this.takeRecords();
      this.callback(records, this);
    });
  }
}

// ===========================================================================
// 第 3 部分：ResizeObserver —— 元素尺寸变化监测
// ===========================================================================

const resizeObservers = new Set();

class ResizeObserver {
  /**
   * @param {Function} callback 签名 (entries, observer)
   */
  constructor(callback) {
    this.callback = callback;
    this._targets = new Set();
    this._queue = [];
    this._scheduled = false;
    resizeObservers.add(this);
  }

  observe(target) {
    this._targets.add(target);
    target._resizeObservers.add(this); // 元素尺寸变化时会反过来通知我
    // 真实规范：observe 之后立刻投递一条初始记录，所以回调一定会先被调用一次
    this._enqueue({
      target,
      contentRect: { x: 0, y: 0, top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 },
      borderBoxSize: [{ inlineSize: 0, blockSize: 0 }],
      contentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
      devicePixelContentBoxSize: [{ inlineSize: 0, blockSize: 0 }],
    });
  }

  unobserve(target) {
    this._targets.delete(target);
    target._resizeObservers.delete(this);
  }

  disconnect() {
    for (const t of this._targets) t._resizeObservers.delete(this);
    this._targets.clear();
    this._queue = [];
    resizeObservers.delete(this);
  }

  takeRecords() {
    return this._queue.splice(0, this._queue.length);
  }

  /** 元素尺寸变了就调这里入队（同一个元素在一帧内只保留最后一条，与真实实现一致） */
  _enqueue(entry) {
    const existing = this._queue.findIndex((e) => e.target === entry.target);
    if (existing !== -1) {
      // 真实浏览器的"深度 1 合并"：同一个元素一帧内多次变化，只投递最后一次的尺寸
      this._queue[existing] = entry;
    } else {
      this._queue.push(entry);
    }
    // 真实浏览器在"渲染前"投递；这里用微任务近似，
    // 效果等价：同一批改动会被合并成一次回调。
    if (!this._scheduled) {
      this._scheduled = true;
      queueMicrotask(() => {
        this._scheduled = false;
        this._deliver();
      });
    }
  }

  _deliver() {
    if (this._queue.length === 0) return;
    const entries = this.takeRecords();
    this.callback(entries, this);
  }
}

// ===========================================================================
// 通用小工具
// ===========================================================================

/** 分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

/**
 * 等待微任务队列清空。
 * 单次 await Promise.resolve() 只让出一次，对于"异步回调里还有 await"的场景不够，
 * 所以这里连续让出多次，确保 queueMicrotask 排下的任务全部跑完。
 */
async function flushMicrotasks() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

// ===========================================================================
// 演示 1：IntersectionObserver 做图片懒加载
// ===========================================================================

section('演示 1：IntersectionObserver —— 图片懒加载');

// 搭一个"长列表"页面：20 个卡片，每个高 180px，从文档坐标 0 开始依次排列
const list = new FakeElement('div', { top: 0, height: 20 * 180 });
list.setAttribute('id', 'list');

const cards = [];
for (let i = 0; i < 20; i++) {
  const card = new FakeElement('img', { top: i * 180, height: 180 });
  card.setAttribute('id', 'card-' + i);
  card.setAttribute('data-src', 'https://example.com/pic-' + i + '.jpg');
  card.className = 'lazy';
  list.appendChild(card);
  cards.push(card);
}
console.log(`搭好了一个长列表：${cards.length} 张待加载的图片，每张高 180px。`);
console.log('视口高度 600px。初始滚动位置 0。');

// 记录真正"加载"过的图片，避免重复加载（真实项目里靠 class / dataset 标记）
const loaded = new Set();

// 关键点：threshold 用 0.1 表示"露出 10% 就算可见"；
// rootMargin '0px 0px 200px 0px' 表示把视口下边界向下扩 200px，
// 也就是"滚到还差 200px 就提前加载"——这是提升体验的常规手法。
const lazyObserver = new IntersectionObserver(
  (entries, observer) => {
    console.log(`  [回调触发] 本次收到 ${entries.length} 条记录（同一帧里的变化被合并成了一次回调）`);
    for (const entry of entries) {
      const id = entry.target.getAttribute('id');
      // 不可见时 intersectionRect 是空矩形，这里换个说法打印，避免看到 [900, 800] 这种反直觉数字
      const area = entry.isIntersecting
        ? `可见区间=[${entry.intersectionRect.top}, ${entry.intersectionRect.bottom}]`
        : `完全在视口外（元素 top=${entry.boundingClientRect.top}）`;
      console.log(`    ${id}: isIntersecting=${entry.isIntersecting}, ratio=${entry.intersectionRatio}, ${area}`);
      if (entry.isIntersecting && !loaded.has(entry.target)) {
        // 真实代码：把 data-src 赋给 src，浏览器才会去下载
        loaded.add(entry.target);
        console.log(`      → 加载 ${entry.target.getAttribute('data-src')}`);
        observer.unobserve(entry.target); // 加载过就不用再观察了，及时释放
      }
    }
  },
  { rootMargin: '0px 0px 200px 0px', threshold: 0.1 },
);

// observe 之后不会立刻回调，浏览器会在下一帧统一处理
for (const card of cards) lazyObserver.observe(card);
console.log('已对 20 张图片调用 observe()。注意：此刻回调还没触发——观察者都是异步的。');

const viewport = new FakeViewport(600);

console.log('');
console.log('--- 滚动到 0px（第一屏） ---');
viewport.scrollTo(0);
console.log(`当前已加载 ${loaded.size} 张`);

console.log('');
console.log('--- 滚动到 1200px ---');
viewport.scrollTo(1200);
console.log(`当前已加载 ${loaded.size} 张`);

console.log('');
console.log('--- 滚动到 2400px ---');
viewport.scrollTo(2400);
console.log(`当前已加载 ${loaded.size} 张`);

console.log('');
console.log('--- 滚回 1200px（已经加载过的不再触发，因为已经 unobserve 了） ---');
viewport.scrollTo(1200);
console.log(`当前已加载 ${loaded.size} 张`);

console.log('');
console.log('对比 scroll 事件的写法：');
console.log('  window.addEventListener("scroll", () => {');
console.log('    for (const img of document.querySelectorAll("img.lazy")) {');
console.log('      if (img.getBoundingClientRect().top < innerHeight + 200) load(img);');
console.log('    }');
console.log('  });');
console.log('  问题：滚动一秒能触发上百次，每次都强制同步布局（读取 rect 会让浏览器立刻重排），');
console.log('        再乘上 20 张图，一秒内就是几千次布局计算 → 页面掉帧。');
console.log('  IntersectionObserver 把计算搬进渲染管线内部，只在状态真正变化时回调，');
console.log('  而且同一帧的多次变化会合并成一次回调。');

lazyObserver.disconnect();
console.log('');
console.log('已调用 disconnect() 清理观察者（组件卸载时务必这么做，否则元素无法被 GC 回收）。');

// ===========================================================================
// 演示 2：IntersectionObserver 做无限滚动
// ===========================================================================

section('演示 2：IntersectionObserver —— 无限滚动（哨兵元素模式）');

// 无限滚动的标准做法：在列表末尾放一个"哨兵"（sentinel），
// 它一进入视口就说明"快到底了"，于是加载下一页并把哨兵继续往后挪。
const ITEM_HEIGHT = 100;
const ITEMS_PER_PAGE = 5;
const FEED_VIEWPORT_HEIGHT = 400;

const feed = new FakeElement('div', { top: 0, height: 0 });
feed.setAttribute('id', 'feed');

let page = 0;
let totalItems = 5; // 假设首屏已经有 5 条数据
const sentinel = new FakeElement('div', { top: totalItems * ITEM_HEIGHT, height: 50 });
sentinel.setAttribute('id', 'sentinel');
sentinel.className = 'sentinel';
feed.appendChild(sentinel);
console.log(`初始状态：已有 ${totalItems} 条数据，哨兵 top=${sentinel.layout.top}，视口高度 ${FEED_VIEWPORT_HEIGHT}。`);
console.log('视口是 [0, 400]，哨兵在 500 处 → 首屏看不到它，观察者安静等待。');

/** 模拟一次网络请求：加载下一页数据 */
async function loadNextPage() {
  page += 1;
  await Promise.resolve(); // 模拟异步 IO
  totalItems += ITEMS_PER_PAGE;
  // 把哨兵继续往后挪，直到下一次进入视口
  sentinel.layout.top = totalItems * ITEM_HEIGHT;
  feed.layout.height = sentinel.layout.top + 50;
  console.log(`  已加载第 ${page} 页，累计 ${totalItems} 条；哨兵新位置 top=${sentinel.layout.top}`);
  return page;
}

let isLoading = false; // 真实项目里必须有这个标志位，防止并发重复请求

const infiniteObserver = new IntersectionObserver(
  async (entries) => {
    for (const entry of entries) {
      console.log(`  [回调触发] 哨兵 isIntersecting=${entry.isIntersecting}, ratio=${entry.intersectionRatio}`);
      if (entry.isIntersecting && !isLoading && page < 4) {
        isLoading = true;
        await loadNextPage();
        isLoading = false;
      }
    }
  },
  { threshold: 0 },
);

infiniteObserver.observe(sentinel);

const scrollViewport = new FakeViewport(FEED_VIEWPORT_HEIGHT);

/**
 * 一次完整的"滚动 + 稳定"过程：
 *   第一帧：滚动后重新计算相交 → 触发回调（异步开始加载）
 *   冲刷微任务：等异步加载真正完成、哨兵被挪到新位置
 *   第二帧：让观察者看到哨兵的新位置，把相交状态复位，
 *           这样下一次滚动才能再次从"不可见 → 可见"地触发回调。
 */
async function scrollAndSettle(y) {
  console.log('');
  console.log(`--- 滚动到 ${y}px ---`);
  scrollViewport.scrollTo(y);
  await flushMicrotasks();
  renderFrame(scrollViewport);
  await flushMicrotasks();
}

// 首帧：observe 之后一定会收到一条初始记录（此时不可见）
scrollViewport.scrollTo(0);
await flushMicrotasks();

await scrollAndSettle(150);
await scrollAndSettle(700);
await scrollAndSettle(1200);
await scrollAndSettle(1700);
await scrollAndSettle(2200);

console.log('');
console.log(`最终：共加载 ${page} 页数据，列表里共 ${totalItems} 条。`);
console.log('（page < 4 的限制让它在第 4 页后停下，真实项目里由服务端返回"没有更多了"决定。）');
console.log('为什么用哨兵而不是直接观察列表最后一项？');
console.log('  因为"最后一项"会在加载完新数据后不再是最后一项，你要反复 unobserve/observe；');
console.log('  而哨兵是个专用空元素，位置由你控制，逻辑更干净。');

infiniteObserver.disconnect();

// ===========================================================================
// 演示 3：MutationObserver —— DOM 变化监测
// ===========================================================================

section('演示 3：MutationObserver —— DOM 变化监测（异步批量投递）');

// 准备一棵被观察的子树
const app = new FakeElement('div', { top: 0, height: 0 });
app.setAttribute('id', 'app');
const title = new FakeElement('h1');
title.setAttribute('id', 'title');
title.textContent = '原始标题';
app.appendChild(title);

const ul = new FakeElement('ul');
ul.setAttribute('id', 'list');
app.appendChild(ul);
for (let i = 0; i < 3; i++) {
  const li = new FakeElement('li');
  li.className = 'item';
  li.textContent = '第 ' + (i + 1) + ' 项';
  ul.appendChild(li);
}
console.log('被观察的树：');
console.log('  <div id="app">');
console.log('    <h1 id="title">原始标题</h1>');
console.log('    <ul id="list"> 3 个 li </ul>');
console.log('  </div>');

const observed = [];
const mo = new MutationObserver((records, observer) => {
  console.log(`  [MutationObserver 回调] 本次一次性收到 ${records.length} 条记录：`);
  for (const r of records) {
    observed.push(r);
    if (r.type === 'childList') {
      const added = r.addedNodes.map((n) => n.nodeName).join(',') || '无';
      const removed = r.removedNodes.map((n) => n.nodeName).join(',') || '无';
      console.log(`    · childList  目标=<${r.target.describe()}>  新增=[${added}]  移除=[${removed}]`);
    } else if (r.type === 'attributes') {
      console.log(`    · attributes 目标=<${r.target.describe()}>  属性=${r.attributeName}  旧值=${JSON.stringify(r.oldValue)}`);
    } else {
      console.log(`    · characterData 目标=${r.target.nodeName}  旧值=${JSON.stringify(r.oldValue)}`);
    }
  }
  console.log(`    （观察者本身作为第二个参数传入：observer === mo → ${observer === mo}）`);
});

// 一次注册，四个开关全开
mo.observe(app, {
  childList: true, // 子节点的增删
  attributes: true, // 属性变化
  attributeOldValue: true, // 并且记下旧值
  attributeFilter: ['class', 'data-state'], // 只关心这两个属性，其它属性变化被忽略
  characterData: true, // 文本节点内容变化
  characterDataOldValue: true,
  subtree: true, // 整棵子树都观察（否则只能看到 app 的直接子节点变化）
});
console.log('');
console.log('已 observe(app, { childList, attributes, attributeOldValue, characterData, characterDataOldValue, subtree, attributeFilter:[class,data-state] })');

console.log('');
console.log('--- 连续做 5 次改动（全在同步代码里一次做完，其中第 3 次不在 attributeFilter 里会被忽略） ---');
const newLi = new FakeElement('li');
newLi.className = 'item hot';
newLi.textContent = '新加的一项';
ul.appendChild(newLi); // ① childList
title.setAttribute('class', 'big'); // ② attributes（在 filter 里，会被记录）
title.setAttribute('id', 'title2'); // ③ attributes（不在 filter 里，被忽略）
title.setAttribute('data-state', 'dirty'); // ④ attributes（在 filter 里）
ul.childNodes[0].firstChild.data = '第 1 项（已改）'; // ⑤ characterData

console.log('（同步代码已执行完，回调还没触发）');
console.log('此刻 mo.takeRecords().length =', mo.takeRecords().length, '← 注意：取走后回调就不会再收到这些记录了');
console.log('');
console.log('重新做几处改动，这次让回调自然触发：');
const anotherLi = new FakeElement('li');
anotherLi.className = 'item';
anotherLi.textContent = '再来一项';
ul.appendChild(anotherLi); // ① childList
title.setAttribute('class', 'bigger'); // ② attributes（在 filter 内）
title.setAttribute('data-state', 'clean'); // ③ attributes（在 filter 内）
ul.childNodes[0].firstChild.data = '第 1 项（又改了）'; // ④ characterData

// 关键：await 一个微任务，MutationObserver 的回调就会跑起来。
// 这证明了它的投递时机是"微任务"，比 setTimeout(0) 更早。
let timerFired = false;
setTimeout(() => {
  timerFired = true;
  console.log('  [setTimeout 回调] 我比 MutationObserver 晚执行');
}, 0);

await flushMicrotasks();
console.log('');
console.log('（微任务已冲刷，上面应该已经看到 MutationObserver 的回调了）');

// 再等一个宏任务，验证顺序
await new Promise((r) => setTimeout(r, 0));
console.log('setTimeout 是否已执行：' + timerFired + '  ← 证明 MutationObserver 是微任务，早于宏任务');

console.log('');
console.log('--- takeRecords() 的用途 ---');
const captured = [];
console.log('takeRecords() 可以在回调触发前"抢走"记录，常用于：');
console.log('  1) 组件销毁前把还没投递的变更捞出来做最后处理；');
console.log('  2) 配合 disconnect() 避免"销毁后回调还在跑"引发的报错。');
ul.appendChild(new FakeElement('li'));
captured.push(...mo.takeRecords());
console.log(`  抢到了 ${captured.length} 条记录；此时再 await 微任务，回调也不会被触发（队列已空）。`);
await flushMicrotasks();

mo.disconnect();
console.log('');
console.log('已 disconnect()。之后的 DOM 改动不会再产生任何记录。');
ul.appendChild(new FakeElement('li'));
await flushMicrotasks();
console.log('验证：又 append 了一个 li，但回调没有再触发。');

console.log('');
console.log('MutationObserver 能观察的三类变化：');
console.log("  childList     —— 子节点的增添与移除（注意：改 textContent 也算！）");
console.log("  attributes    —— 属性变化，可用 attributeFilter 只盯某几个属性");
console.log("  characterData —— 文本节点 data 的变化");
console.log('还有一个容易误解的点：element.textContent = "x" 产生的不是 characterData，');
console.log('而是 childList（因为它是"清空子节点 + 插入一个文本节点"）。');

// ===========================================================================
// 演示 4：ResizeObserver —— 元素尺寸变化
// ===========================================================================

section('演示 4：ResizeObserver —— 元素尺寸变化监测');

const box = new FakeElement('div', { top: 0, height: 100 });
box.setAttribute('id', 'box');
box.className = 'panel';
box.layout.width = 300;

let resizeCount = 0;
const ro = new ResizeObserver((entries, observer) => {
  resizeCount += 1;
  console.log(`  [ResizeObserver 回调] 第 ${resizeCount} 次触发，收到 ${entries.length} 条记录：`);
  for (const entry of entries) {
    const r = entry.contentRect;
    console.log(
      `    <${entry.target.describe()}> contentRect = ${r.width} x ${r.height}` +
        `  borderBox = ${entry.borderBoxSize[0].inlineSize} x ${entry.borderBoxSize[0].blockSize}`,
    );
  }
  console.log(`    （第二个参数是观察者本身：observer === ro → ${observer === ro}）`);
});

console.log('调用 observe(box)，注意：observe 会立刻投递一条"初始尺寸"记录。');
ro.observe(box);
await flushMicrotasks();

console.log('');
console.log('--- 把盒子改成 400 x 250 ---');
box.setSize(400, 250);
await flushMicrotasks();

console.log('');
console.log('--- 改成一样的大小（不会触发，因为尺寸没变） ---');
box.setSize(400, 250);
await flushMicrotasks();
console.log('  （没有输出，说明 ResizeObserver 只在尺寸真的变化时才回调）');

console.log('');
console.log('--- 在 <img> 加载完成后自动撑高：ResizeObserver 最典型的用途之一 ---');
box.setSize(400, 500);
await flushMicrotasks();

console.log('');
console.log('--- 同一批里改三次，只会触发一次回调，且只收到最后那个尺寸（深度 1 合并） ---');
box.setSize(410, 510);
box.setSize(420, 520);
box.setSize(430, 530);
await flushMicrotasks();
console.log('  注意上面只打印了 430 x 530 这一条 —— 中间的 410、420 被合并丢掉了。');

console.log('');
console.log('著名的报错："ResizeObserver loop completed with undelivered notifications"');
console.log('  触发条件：在 ResizeObserver 回调里**同步地**改变了被观察元素自身的尺寸，');
console.log('            导致本轮还没投递完就产生了新的一轮变化，浏览器只能报错并跳过这一帧。');
console.log('  正确写法：把尺寸改动推迟到下一帧 ——');
console.log('      const ro = new ResizeObserver(() => {');
console.log('        requestAnimationFrame(() => { el.style.width = ...; });');
console.log('      });');
console.log('  或者从根本上避免"观察自己又改自己"（例如改成观察父容器，只改子元素）。');

console.log('');
console.log('ResizeObserver 观察的是 content box（内容盒，不含 padding/border）。');
console.log('entry 里还提供：');
console.log('  borderBoxSize[]            → 边框盒尺寸（含 padding + border）');
console.log('  contentBoxSize[]           → 内容盒尺寸（与 contentRect 等价，但数组形式）');
console.log('  devicePixelContentBoxSize[]→ 设备物理像素下的内容盒尺寸，做 Canvas 高清渲染时用它');
console.log('  用数组形式是因为元素可能处于多列布局（fragmentation）中，会被拆成多段。');

ro.disconnect();
console.log('');
console.log('已 disconnect()。');

// ===========================================================================
// 第 5 部分：三者对比总结
// ===========================================================================

section('总览：三大观察者对比');

const summary = [
  ['IntersectionObserver', '元素与视口/祖先的相交状态', '渲染前（同一帧合并）', '懒加载、无限滚动、曝光埋点、视频自动暂停'],
  ['MutationObserver', 'DOM 树的增删、属性、文本变化', '微任务（比 setTimeout 早）', '监听第三方脚本改动、富文本编辑器、框架的 diff 兜底'],
  ['ResizeObserver', '元素 content box 的尺寸变化', '渲染前（同一帧合并）', '图表自适应、虚拟列表测高、布局联动'],
];

for (const [name, what, when, use] of summary) {
  console.log(`· ${name}`);
  console.log(`    观察什么：${what}`);
  console.log(`    何时投递：${when}`);
  console.log(`    典型用途：${use}`);
}

console.log('');
console.log('三者共有的生命周期方法：observe / unobserve / disconnect / takeRecords。');
console.log('共同的使用纪律：');
console.log('  1) 异步投递 —— 不要指望 observe() 之后立刻拿到结果；');
console.log('  2) 批量合并 —— 一次回调可能带来多条 entry，永远用 for 循环处理全部；');
console.log('  3) 及时清理 —— 元素或组件销毁时 disconnect，否则内存泄漏；');
console.log('  4) 回调里别再触发自己关心的变化 —— 否则死循环或 ResizeObserver loop 报错。');
