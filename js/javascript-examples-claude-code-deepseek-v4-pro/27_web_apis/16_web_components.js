/**
 * ============================================================================
 * 知识点：Web Components 三件套（自定义元素 / Shadow DOM / template+slot）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/01_dom_query.js（DOM 树与节点）、
 *             27_web_apis/02_dom_events.js（事件传播与冒泡）、
 *             14_classes/01_class_basics.js（class 与继承）、16_prototype/01_prototype.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Web Components 不是"一个 API"，而是**四个浏览器标准的合称**，它们一起提供了
 *    "原生组件"的能力：
 *      · Custom Elements（自定义元素）：customElements.define('my-tag', class extends HTMLElement {...})
 *      · Shadow DOM：element.attachShadow({ mode }) —— 给元素挂一棵独立的子树
 *      · <template> + <slot>：可复用的结构模板 + 内容分发（插槽）
 *      · ES Modules：把上面三样打包成可发布的组件文件（见 19_modules 目录）
 *
 * 2. 为什么需要（它到底解决了什么）
 *    React / Vue 的组件化，本质是三件事：
 *      ① 结构封装：组件内部的 DOM 外面不该随便改；
 *      ② 样式封装：外面的 CSS 不该污染组件内部，组件内部的样式也不该漏出去；
 *      ③ 行为封装：一段逻辑注册一次，页面里任何地方写 <my-tag> 就能用。
 *    Web Components 把这三件事做成了**浏览器原生能力**：不需要框架、不需要构建、
 *    不需要运行时。它也是框架之间的"最大公约数"——React/Vue/Angular 都能直接用
 *    别人写好的自定义元素。
 *
 * 3. 核心语法要点
 *    （1）定义
 *        class MyCard extends HTMLElement {
 *          static get observedAttributes() { return ['title']; }   // 声明要观察哪些属性
 *          constructor() { super(); this.attachShadow({ mode: 'open' }); }
 *          connectedCallback() { }              // 插入文档时
 *          disconnectedCallback() { }           // 从文档移除时
 *          attributeChangedCallback(name, oldV, newV) { }  // 被观察属性变化时
 *          adoptedCallback() { }                // 被移动到别的 document 时（罕用）
 *        }
 *        customElements.define('my-card', MyCard);
 *        规则：标签名**必须含一个短横线**（避免和将来新增的 HTML 标签冲突）、
 *        不能重复定义、类必须继承 HTMLElement（不是 HTMLElement 的实例会抛 TypeError）。
 *
 *    （2）Shadow DOM
 *        const shadow = el.attachShadow({ mode: 'open' });   // 'closed' 时 el.shadowRoot 为 null
 *        shadow.innerHTML = '<style>p{color:red}</style><p>内部</p>';
 *        关键性质：外部 CSS 选择器**选不中** shadow 树里的元素；
 *        shadow 树里的样式也漏不出去。这就是"样式隔离"。
 *        想给宿主自己写样式用 :host；想给插槽进来的内容写样式用 ::slotted(...)。
 *
 *    （3）template + slot
 *        <template id="tpl"><p><slot name="title">默认标题</slot></p></template>
 *        const frag = document.getElementById('tpl').content.cloneNode(true);
 *        shadow.appendChild(frag);
 *        <slot> 是"内容分发"的占位符：宿主标签里的子节点会被投影到对应的 slot 位置。
 *        slot 里的内容只是**后备内容**（没有分配内容时显示）。
 *        属性 slot="title" 的子节点进入具名插槽 name="title"；没有 slot 属性的进默认插槽。
 *
 *    （4）事件跨边界
 *        this.dispatchEvent(new CustomEvent('count-changed', {
 *          detail: { value: 3 },
 *          bubbles: true,     // 允许向上冒泡
 *          composed: true,    // 允许**穿过 shadow 边界**
 *        }));
 *        没有 composed: true 的事件出了 shadow root 就没了，外面永远收不到。
 *        另一个细节是**事件重定向（retargeting）**：外部监听器看到的 event.target
 *        是宿主元素，而不是 shadow 里真正被点中的那个节点 —— 这是封装的一部分。
 *
 * 4. 常见陷阱
 *    - 忘了 composed: true，事件"在组件里发了但外面收不到"（最常见的一个坑）。
 *    - 在 constructor 里访问属性或 DOM：此时元素还没插入文档、子节点还没解析完，
 *      应该放在 connectedCallback 里。
 *    - 同一个标签名定义两次 → NotSupportedError。
 *    - 标签名不带短横线 → SyntaxError（'mycard' 不合法，'my-card' 才合法）。
 *    - 以为 shadow DOM 是"安全边界"：它只是封装，不是沙箱，宿主页面仍能通过
 *      el.shadowRoot（mode: 'open' 时）拿到内部节点。
 *    - closed 模式也挡不住真正想看的人（构造时留个引用即可），它只是"不想让你看"。
 *
 * 【本文件在 Node 中如何演示】
 *   Node 里没有 DOM、没有 HTMLElement、没有 customElements。
 *   本文件用纯 JS 手写了一套"迷你 DOM + 迷你 Custom Elements 注册表"，把浏览器
 *   那套语义完整复刻出来（每一步都打印可观察的证据）：
 *     · MiniElement / MiniShadowRoot / MiniTextNode：节点树、连接状态、cloneNode；
 *     · MiniHTMLElement：attachShadow、setAttribute、四个生命周期回调；
 *     · MiniCustomElementRegistry：define / get / whenDefined / **延迟升级**（先有元素、
 *       后定义类时，已有的元素会被"升级"）；
 *     · MiniEvent：bubbles / composed / composedPath / **retargeting（事件重定向）**；
 *     · 一个极简选择器引擎，用实证的方式展示"外部 CSS 选不中 shadow 内部"。
 *   真实浏览器里把 Mini 前缀去掉，就是同一套东西。
 *
 * 【运行方法】
 *   node 27_web_apis/16_web_components.js
 *
 * 【预期输出】
 *   八个部分：框架组件化的三件事、迷你 DOM 的实现与自定义元素注册（含名单规则与
 *   延迟升级）、四个生命周期回调的触发顺序、属性观察、Shadow DOM 与样式隔离实证、
 *   template + 具名/默认插槽的投影结果、事件跨边界（composed 与重定向）、
 *   以及与框架组件化的关系小结。
 * ============================================================================
 */

/** 分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

/** 造一个名字正确的错误（浏览器里这些是 DOMException） */
function domError(name, message) {
  const err = new Error(message);
  err.name = name;
  return err;
}

// ===========================================================================
// 第 1 部分：迷你 DOM —— 先把"树"造出来
// ===========================================================================

section('--- 1. 迷你 DOM：节点、元素、文本、ShadowRoot ---');

/** 所有节点的基类：负责树结构 + 事件 + 连接状态 */
class MiniNode {
  constructor(ownerDocument) {
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.childNodes = [];
    this._listeners = new Map(); // Map<type, fn[]>
  }

  get isConnected() {
    let n = this;
    while (n.parentNode) n = n.parentNode;
    // 一路爬到顶：顶节点是 MiniDocument 就说明在文档里
    return n.nodeType === 9;
  }

  /** 这个节点所属的"根"：可能是 MiniDocument，也可能是某个 MiniShadowRoot */
  getRootNode() {
    let n = this;
    while (n.parentNode) n = n.parentNode;
    return n;
  }

  appendChild(child) {
    return this.insertBefore(child, null);
  }

  insertBefore(child, ref) {
    if (child.parentNode) child.parentNode.removeChild(child);
    const i = ref ? this.childNodes.indexOf(ref) : this.childNodes.length;
    if (ref && i === -1) throw domError('NotFoundError', '参照节点不是当前节点的子节点');
    this.childNodes.splice(i, 0, child);
    child.parentNode = this;
    // 插入到一棵"已连接"的树里 → 该子树里所有自定义元素都要触发 connectedCallback
    if (this.isConnected) notifyConnected(child);
    return child;
  }

  removeChild(child) {
    const i = this.childNodes.indexOf(child);
    if (i === -1) throw domError('NotFoundError', '要删除的节点不是当前节点的子节点');
    this.childNodes.splice(i, 1);
    child.parentNode = null;
    notifyDisconnected(child);
    return child;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  /** 深度优先遍历自己（含自己） */
  *walk() {
    yield this;
    for (const c of this.childNodes) yield* c.walk();
  }

  /** 极简选择器引擎：支持 tag / .class / #id / [attr] / 后代与子代组合符 */
  querySelectorAll(selector) {
    const out = [];
    for (const node of this.walk()) {
      if (node !== this && node.matches && node.matches(selector)) out.push(node);
    }
    return out;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  // ---------------------------------------------------------------- 事件
  /** options 可以是布尔值（等价于 { capture }），和浏览器一致 */
  addEventListener(type, fn, options) {
    const capture = typeof options === 'boolean' ? options : Boolean(options && options.capture);
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push({ fn, capture });
  }

  removeEventListener(type, fn) {
    const list = this._listeners.get(type);
    if (!list) return;
    const i = list.findIndex((l) => l.fn === fn);
    if (i >= 0) list.splice(i, 1);
  }

  /** 派发事件：捕获（root → 父）→ 目标 → 冒泡（父 → root） */
  dispatchEvent(event) {
    event._originalTarget = this;
    const path = event._buildPath(this);
    // ① 捕获阶段：从根往下走到目标的父节点（只叫 capture: true 的监听器）
    for (let i = path.length - 1; i >= 1; i--) {
      if (event._stopped) break;
      event._currentTarget = path[i];
      event._phase = 1;
      path[i]._fire(event, 1);
    }
    // ② 目标阶段：只触发一次（真实 DOM 在目标上也是只触发一次，capture 与否都叫）
    if (!event._stopped) {
      event._currentTarget = path[0];
      event._phase = 2;
      path[0]._fire(event, 2);
    }
    // ③ 冒泡阶段：bubbles 为 false 时立即结束
    if (event.bubbles) {
      for (let i = 1; i < path.length; i++) {
        if (event._stopped) break;
        event._currentTarget = path[i];
        event._phase = 3;
        path[i]._fire(event, 3);
      }
    }
    return !event.defaultPrevented;
  }

  _fire(event, phase) {
    const list = this._listeners.get(event.type);
    if (!list) return;
    for (const { fn, capture } of [...list]) {
      if (event._stoppedImmediate) break;
      if (phase === 1 && !capture) continue; // 捕获阶段不叫普通监听器
      if (phase === 3 && capture) continue; // 冒泡阶段不叫捕获监听器
      fn.call(this, event);
    }
  }

  // ---------------------------------------------------------------- 匹配
  /** 判断自己是否符合选择器（支持逗号分组 + 后代/子代组合） */
  matches(selector) {
    return String(selector)
      .split(',')
      .some((s) => matchCompound(this, s.trim()));
  }
}

/** 只处理最右边一段"复合选择器"：tag.class#id[attr] 以及 :host / ::slotted(x) */
function matchCompound(el, selector) {
  // 带组合符的交给上层逐段拆解（这里只做单段匹配）
  const parts = selector.split(/\s+|>/).filter(Boolean);
  const last = parts[parts.length - 1];
  if (!matchSimple(el, last)) return false;
  if (parts.length === 1) return true;
  // 简化的祖先/父级检查：只校验最后一个组合符
  const isChild = selector.includes('>');
  let cur = isChild ? el.parentNode : el.parentNode;
  const rest = parts.slice(0, -1);
  let idx = rest.length - 1;
  while (cur && idx >= 0) {
    if (matchSimple(cur, rest[idx])) {
      idx -= 1;
      if (isChild) break;
    }
    cur = cur.parentNode;
  }
  return idx < 0;
}

/** 匹配单个简单选择器，如 p、.inner、#x、[slot="name"]、p.inner */
function matchSimple(el, simple) {
  if (!el || el.nodeType !== 1) return false; // 只有元素节点才谈得上"匹配选择器"
  if (simple === ':host') return Boolean(el._isHostMarker);
  const slotted = simple.match(/^::slotted\((.+)\)$/);
  if (slotted) return Boolean(el._isSlotted) && matchSimple(el, slotted[1]);

  let rest = simple;
  // 标签名
  const tagMatch = rest.match(/^[a-zA-Z][\w-]*/);
  if (tagMatch) {
    if (el.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) return false;
    rest = rest.slice(tagMatch[0].length);
  }
  // 逐段吃掉 .class / #id / [attr] / [attr="v"]
  const tokenRe = /([.#][\w-]+|\[[\w-]+(?:=["'][^"']*["'])?\])/g;
  let m;
  while ((m = tokenRe.exec(rest)) !== null) {
    const tok = m[1];
    if (tok.startsWith('.')) {
      if (!el.classList.contains(tok.slice(1))) return false;
    } else if (tok.startsWith('#')) {
      if (el.getAttribute('id') !== tok.slice(1)) return false;
    } else {
      const inner = tok.slice(1, -1);
      const eq = inner.indexOf('=');
      if (eq === -1) {
        if (!el.hasAttribute(inner)) return false;
      } else {
        const name = inner.slice(0, eq);
        const val = inner.slice(eq + 1).replace(/^["']|["']$/g, '');
        if (el.getAttribute(name) !== val) return false;
      }
    }
  }
  return true;
}

/** 文本节点 */
class MiniTextNode extends MiniNode {
  constructor(doc, text) {
    super(doc);
    this.nodeType = 3;
    this.data = String(text);
  }

  get textContent() {
    return this.data;
  }

  getRootNode() {
    let n = this;
    while (n.parentNode) n = n.parentNode;
    return n;
  }

  cloneNode() {
    return new MiniTextNode(this.ownerDocument, this.data);
  }

  get tagName() {
    return '#text'; // 文本节点没有标签名，但事件重定向时会读它，给个占位
  }
}

/** 元素节点 */
class MiniElement extends MiniNode {
  constructor(doc, tagName) {
    super(doc);
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this._attributes = new Map();
    this._shadowRoot = null;
    this._isHostMarker = false; // 供 :host 选择器识别
    this._isSlotted = false; // 供 ::slotted 选择器识别
  }

  get classList() {
    const self = this;
    const raw = () => (self._attributes.get('class') || '').split(/\s+/).filter(Boolean);
    return {
      contains: (c) => raw().includes(c),
      add: (c) => {
        const list = raw();
        if (!list.includes(c)) list.push(c);
        self._attributes.set('class', list.join(' '));
      },
      remove: (c) => {
        self._attributes.set(
          'class',
          raw()
            .filter((x) => x !== c)
            .join(' '),
        );
      },
      toString: () => raw().join(' '),
    };
  }

  get id() {
    return this._attributes.get('id') || '';
  }

  get className() {
    return this._attributes.get('class') || '';
  }

  set className(v) {
    this._attributes.set('class', String(v));
  }

  getAttribute(name) {
    return this._attributes.has(name) ? this._attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  removeAttribute(name) {
    this._attributes.delete(name);
  }

  /** 设置属性：如果该属性在 observedAttributes 里，就要回调 attributeChangedCallback */
  setAttribute(name, value) {
    const oldValue = this.getAttribute(name);
    const newValue = String(value);
    this._attributes.set(name, newValue);
    if (typeof this.attributeChangedCallback === 'function') {
      const observed = this.constructor.observedAttributes || [];
      if (observed.includes(name)) {
        this.attributeChangedCallback(name, oldValue, newValue);
      }
    }
  }

  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }

  set textContent(v) {
    this.childNodes = [];
    this.appendChild(new MiniTextNode(this.ownerDocument, v));
  }

  /** 序列化/反序列化子树（真实 DOM 里 innerHTML 就是干这个的） */
  get innerHTML() {
    return this.childNodes.map(serialize).join('');
  }

  set innerHTML(html) {
    this.childNodes = [];
    parseHTML(this, String(html));
  }

  /** 挂一棵影子树 */
  attachShadow(options = {}) {
    if (this._shadowRoot) throw domError('NotSupportedError', '这个元素已经挂过 shadow root 了');
    if (this.tagName.includes('-') === false && !['DIV', 'SPAN', 'SECTION'].includes(this.tagName)) {
      // 真实的浏览器只允许一部分内置标签挂 shadow（div/span/section/article/...）
      throw domError('NotSupportedError', this.tagName + ' 不允许挂 shadow root');
    }
    this._shadowRoot = new MiniShadowRoot(this.ownerDocument, this, options.mode || 'open');
    this._isHostMarker = true;
    return this._shadowRoot;
  }

  /** mode: 'closed' 时对外返回 null，内部照样能用（这就是"closed 只是不给你看"） */
  get shadowRoot() {
    if (!this._shadowRoot) return null;
    return this._shadowRoot.mode === 'open' ? this._shadowRoot : null;
  }

  cloneNode(deep = false) {
    const copy = new MiniElement(this.ownerDocument, this.tagName);
    for (const [k, v] of this._attributes) copy._attributes.set(k, v);
    if (deep) for (const c of this.childNodes) copy.appendChild(c.cloneNode(true));
    return copy;
  }
}

/** 文档片段：一棵"游离"的子树的根（template.content 就是它） */
class MiniFragment extends MiniNode {
  constructor(doc) {
    super(doc);
    this.nodeType = 11; // DocumentFragment
  }

  get innerHTML() {
    return this.childNodes.map(serialize).join('');
  }

  /** 用一小段 HTML 字符串搭树（只支持最简标签，够演示用） */
  set innerHTML(html) {
    this.childNodes = [];
    parseHTML(this, String(html));
  }

  cloneNode(deep = false) {
    const copy = new MiniFragment(this.ownerDocument);
    if (deep) for (const c of this.childNodes) copy.appendChild(c.cloneNode(true));
    return copy;
  }

  get textContent() {
    return this.childNodes.map((c) => c.textContent).join('');
  }
}

/** 影子根：它是一棵子树的根，同时记住宿主是谁 */
class MiniShadowRoot extends MiniFragment {
  constructor(doc, host, mode) {
    super(doc);
    this.host = host;
    this.mode = mode;
  }

  /** shadow 树里所有 slot 元素 */
  get slots() {
    return this.querySelectorAll('slot');
  }
}

/** 把树序列化成 HTML 字符串（只为日志好看） */
function serialize(node) {
  if (node.nodeType === 3) return node.data;
  if (node.nodeType === 11) return node.childNodes.map(serialize).join(''); // 片段本身没有标签
  const attrs = [...node._attributes].map(([k, v]) => ` ${k}="${v}"`).join('');
  if (!node.childNodes.length) return `<${node.tagName.toLowerCase()}${attrs}>`;
  return `<${node.tagName.toLowerCase()}${attrs}>${node.childNodes.map(serialize).join('')}</${node.tagName.toLowerCase()}>`;
}

/** 极简 HTML 解析：够解析本文件用到的模板就行 */
function parseHTML(parent, html) {
  const re = /<\/?([a-zA-Z][\w-]*)((?:\s+[\w-]+="[^"]*")*)\s*\/?>/g;
  const stack = [parent];
  let last = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = html.slice(last, m.index).trim();
    if (text) stack[stack.length - 1].appendChild(new MiniTextNode(parent.ownerDocument, text));
    last = re.lastIndex;
    const isClose = m[0][1] === '/';
    const tag = m[1];
    if (isClose) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const el = new MiniElement(parent.ownerDocument, tag);
    for (const am of m[2].matchAll(/([\w-]+)="([^"]*)"/g)) el.setAttribute(am[1], am[2]);
    stack[stack.length - 1].appendChild(el);
    if (!m[0].endsWith('/>')) stack.push(el);
  }
  const tail = html.slice(last).trim();
  if (tail) stack[stack.length - 1].appendChild(new MiniTextNode(parent.ownerDocument, tail));
  return parent;
}

/** <template>：它的内容躺在 .content 里，不会被渲染，cloneNode 出来才能用 */
class MiniTemplateElement extends MiniElement {
  constructor(doc) {
    super(doc, 'template');
    this.content = new MiniFragment(doc);
  }

  /** 把标签之间的内容当成模板内容 */
  _setTemplateHTML(html) {
    this.content.childNodes = [];
    parseHTML(this.content, html);
  }
}

/** 文档：树根，也负责 createElement */
class MiniDocument extends MiniNode {
  constructor() {
    super(null);
    this.ownerDocument = this;
    this.nodeType = 9;
    this.documentElement = new MiniElement(this, 'html');
    this.body = new MiniElement(this, 'body');
    this.appendChild(this.documentElement);
    this.documentElement.appendChild(this.body);
    this._registry = null;
  }

  createElement(tag) {
    const name = String(tag).toLowerCase();
    const Ctor = this._registry ? this._registry.get(name) : undefined;
    if (Ctor) return new Ctor(); // 已定义 → 直接造出自定义元素的实例
    if (name.includes('-')) {
      // 还没定义 → 先造个"占位"，等 define 时再升级（浏览器的真实行为）
      const el = new MiniElement(this, name);
      el._pendingUpgrade = name;
      if (this._registry) this._registry._queueUpgrade(el);
      return el;
    }
    if (name === 'template') return new MiniTemplateElement(this);
    return new MiniElement(this, name);
  }
}

// ===========================================================================
// 第 2 部分：自定义元素 —— HTMLElement 与注册表
// ===========================================================================

section('--- 2. 自定义元素：customElements.define 与"延迟升级" ---');

/** 自定义元素的基类。浏览器里的它叫 HTMLElement，是所有 HTML 元素的共同祖先 */
class MiniHTMLElement extends MiniElement {
  constructor() {
    super(currentDocument, 'div'); // 真实实现里 tagName 由注册表定，这里先占位
    this.tagName = (new.target.tagName || 'div').toUpperCase();
  }

  /** 默认不观察任何属性；子类用 static get observedAttributes() 覆盖 */
  static get observedAttributes() {
    return [];
  }

  // 下面四个生命周期回调默认是"空动作"，子类按需覆盖
  connectedCallback() {}
  disconnectedCallback() {}
  attributeChangedCallback() {}
  adoptedCallback() {}
}

/** 自定义元素注册表 —— 浏览器的 window.customElements */
class MiniCustomElementRegistry {
  constructor(doc) {
    this._doc = doc;
    this._defs = new Map(); // name → class
    this._pending = new Map(); // name → 等待升级的元素
    this._whenDefined = new Map(); // name → resolve 队列
    this._upgradeLog = [];
  }

  /**
   * 定义一个自定义元素。
   * 两条硬性规则：名字必须含短横线；同名不能定义两次。
   */
  define(name, ctor) {
    const tag = String(name).toLowerCase();
    if (!/^[a-z][a-z0-9._]*-[a-z0-9._-]*$/.test(tag)) {
      throw domError('SyntaxError', `"${name}" 不是合法的自定义元素名（必须含一个短横线，如 my-card）`);
    }
    if (this._defs.has(tag)) {
      throw domError('NotSupportedError', `自定义元素 "${tag}" 已经被定义过了`);
    }
    if (typeof ctor !== 'function' || !(ctor.prototype instanceof MiniHTMLElement)) {
      throw domError('TypeError', '第二个参数必须是继承自 HTMLElement 的类');
    }
    this._defs.set(tag, ctor);

    // 已经存在于文档里的同名元素，此刻被"升级"
    const waiting = this._pending.get(tag) || [];
    this._pending.delete(tag);
    for (const el of waiting) {
      const upgraded = this._upgrade(el, ctor);
      this._upgradeLog.push(`${tag}：把先创建的占位元素升级成了 ${ctor.name} 实例`);
      void upgraded;
    }

    const resolvers = this._whenDefined.get(tag) || [];
    this._whenDefined.delete(tag);
    for (const r of resolvers) r(ctor);
    return ctor;
  }

  get(name) {
    return this._defs.get(String(name).toLowerCase());
  }

  /** 等某个标签被定义（常用于"组件脚本还没加载完就想用它"的场景） */
  whenDefined(name) {
    const tag = String(name).toLowerCase();
    if (this._defs.has(tag)) return Promise.resolve(this._defs.get(tag));
    return new Promise((resolve) => {
      if (!this._whenDefined.has(tag)) this._whenDefined.set(tag, []);
      this._whenDefined.get(tag).push(resolve);
    });
  }

  _queueUpgrade(el) {
    const tag = el.tagName.toLowerCase();
    if (!this._pending.has(tag)) this._pending.set(tag, []);
    this._pending.get(tag).push(el);
  }

  /**
   * 升级：把一个占位元素变成真正的自定义元素实例。
   * 真实浏览器是**就地换原型**（同一个对象，原型从 HTMLElement 换成子类），
   * 本迷你实现为了简单，换成"造一个新实例、把属性与子节点搬过去、替换进树"。
   */
  _upgrade(el, Ctor) {
    const nu = new Ctor();
    for (const [k, v] of el._attributes) nu._attributes.set(k, v);
    for (const c of [...el.childNodes]) nu.appendChild(c);
    if (el.parentNode) {
      const parent = el.parentNode;
      const i = parent.childNodes.indexOf(el);
      parent.childNodes[i] = nu;
      nu.parentNode = parent;
      el.parentNode = null;
      if (nu.isConnected) {
        // 升级后要补发 attributeChangedCallback 和 connectedCallback
        for (const [k, v] of nu._attributes) {
          const observed = Ctor.observedAttributes || [];
          if (observed.includes(k)) nu.attributeChangedCallback(k, null, v);
        }
        notifyConnected(nu);
      }
    }
    return nu;
  }
}

/** 连接状态变化时，递归通知子树里的所有自定义元素（含 shadow 树） */
function notifyConnected(node) {
  for (const n of node.walk()) {
    if (typeof n.connectedCallback === 'function' && n._upgraded !== false) {
      if (n.constructor !== MiniElement && n.constructor !== MiniHTMLElement) n.connectedCallback();
    }
    // shadow 树里的元素也要通知（真实 DOM 同样如此）
    if (n._shadowRoot) notifyConnected(n._shadowRoot);
  }
}

function notifyDisconnected(node) {
  for (const n of node.walk()) {
    if (typeof n.disconnectedCallback === 'function' && n.constructor !== MiniElement && n.constructor !== MiniHTMLElement) {
      n.disconnectedCallback();
    }
    if (n._shadowRoot) notifyDisconnected(n._shadowRoot);
  }
}

// ===========================================================================
// 第 3 部分：事件 —— bubbles / composed / retargeting
// ===========================================================================

/** 迷你事件对象 */
class MiniEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.bubbles = Boolean(options.bubbles);
    this.composed = Boolean(options.composed);
    this.detail = options.detail ?? null;
    this.defaultPrevented = false;
    this._stopped = false;
    this._stoppedImmediate = false;
    this._originalTarget = null;
    this._currentTarget = null;
    this._phase = 0;
  }

  /**
   * target 的"重定向"：监听器在 shadow 树之外时，看到的是宿主元素，
   * 而不是 shadow 内部真正被操作的那个节点。这是封装的一部分。
   */
  get target() {
    return retarget(this._originalTarget, this._currentTarget ? this._currentTarget.getRootNode() : null);
  }

  get currentTarget() {
    return this._currentTarget;
  }

  /** 本次派发的完整路径（含被 composed 规则截断的部分） */
  composedPath() {
    return this._buildPath(this._originalTarget);
  }

  _buildPath(target) {
    const path = [];
    let node = target;
    let crossedShadow = false;
    while (node) {
      if (crossedShadow && !this.composed) break; // 非 composed 的事件出不去 shadow root
      path.push(node);
      if (node.parentNode) {
        node = node.parentNode;
      } else if (node.host) {
        node = node.host; // 从 shadow root 穿到宿主
        crossedShadow = true;
      } else {
        break;
      }
    }
    return path;
  }

  preventDefault() {
    this.defaultPrevented = true;
  }

  stopPropagation() {
    this._stopped = true;
  }

  stopImmediatePropagation() {
    this._stopped = true;
    this._stoppedImmediate = true;
  }
}

/** 自定义事件（浏览器里是 CustomEvent，Node 里没有 DOM 所以自己写一个） */
class MiniCustomEvent extends MiniEvent {
  constructor(type, options = {}) {
    super(type, options);
  }
}

/** 把 target 重定向到"观察者所在的那棵树"里对应的节点 */
function retarget(target, observerRoot) {
  let node = target;
  for (;;) {
    const root = node.getRootNode ? node.getRootNode() : null;
    if (root === observerRoot || !root || !root.host) return node;
    node = root.host; // 跨过一层 shadow 边界，变成宿主
  }
}

// ===========================================================================
// 第 4 部分：跑起来 —— 定义一个真实的组件
// ===========================================================================

section('--- 3. 生命周期：constructor → attributeChangedCallback → connected → disconnected ---');

/** 迷你实现里"当前文档"这个全局变量，对应浏览器的 document */
let currentDocument = null;

const doc = new MiniDocument();
currentDocument = doc;
const registry = new MiniCustomElementRegistry(doc);
doc._registry = registry;

/** 一个带计数器逻辑的组件：<my-counter start="3" step="2"> */
class MyCounter extends MiniHTMLElement {
  static get observedAttributes() {
    return ['start', 'step']; // 只观察这两个属性
  }

  constructor() {
    super();
    this.tagName = 'MY-COUNTER';
    this.value = 0;
    console.log('    [MyCounter] constructor()：元素被创建（此时还没有属性、也不在文档里）');
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<style>button{color:red}</style><button class="inc">+</button><span class="num">0</span>';
    // 组件内部监听自己的按钮（外部完全不知道这个按钮的存在）
    const btn = shadow.querySelector('button');
    btn.addEventListener('click', () => {
      this.value += this.step;
      shadow.querySelector('span').textContent = String(this.value);
      // 向外广播：composed: true 才能穿出 shadow 边界
      this.dispatchEvent(new MiniCustomEvent('count-changed', { detail: { value: this.value }, bubbles: true, composed: true }));
    });
  }

  get start() {
    return Number(this.getAttribute('start') ?? 0);
  }

  get step() {
    return Number(this.getAttribute('step') ?? 1);
  }

  connectedCallback() {
    this.value = this.start; // 注意：读属性要等连上文档后再做
    console.log(`    [MyCounter] connectedCallback()：已插入文档，start=${this.start} step=${this.step}`);
    const shadow = this._shadowRoot;
    if (shadow) shadow.querySelector('span').textContent = String(this.value);
  }

  disconnectedCallback() {
    console.log('    [MyCounter] disconnectedCallback()：已从文档移除，这里适合清理定时器 / 取消订阅');
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`    [MyCounter] attributeChangedCallback('${name}', ${JSON.stringify(oldValue)}, ${JSON.stringify(newValue)})`);
  }
}

registry.define('my-counter', MyCounter);
console.log('customElements.define("my-counter", MyCounter) 完成');
console.log('');

console.log('① 规则一：名字必须含短横线');
try {
  registry.define('mycounter', class extends MiniHTMLElement {});
} catch (err) {
  console.log('    ✗ ' + err.name + '：' + err.message);
}
console.log('② 规则二：同一个名字不能定义两次');
try {
  registry.define('my-counter', MyCounter);
} catch (err) {
  console.log('    ✗ ' + err.name + '：' + err.message);
}
console.log('③ 规则三：类必须继承自 HTMLElement');
try {
  registry.define('my-bad', class {});
} catch (err) {
  console.log('    ✗ ' + err.name + '：' + err.message);
}
console.log('');

console.log('④ 创建并插入文档，观察回调顺序：');
const c1 = doc.createElement('my-counter');
console.log('    createElement 之后：isConnected =', c1.isConnected);
c1.setAttribute('start', '3'); // 还没连上文档，但属性变化照样回调
c1.setAttribute('step', '2');
c1.setAttribute('title', '这个属性没有被观察，不会触发回调');
doc.body.appendChild(c1);
console.log('    appendChild 之后：isConnected =', c1.isConnected, '，当前值 =', c1.value);
console.log('');

console.log('⑤ 模拟点击组件内部的按钮（外部只看到组件向外派发的事件）：');
doc.body.addEventListener('count-changed', (e) => {
  console.log('    [document.body 收到 count-changed] detail =', JSON.stringify(e.detail), '，event.target =', e.target.tagName.toLowerCase());
});
const innerBtn = c1._shadowRoot.querySelector('button');
innerBtn.dispatchEvent(new MiniEvent('click', { bubbles: true, composed: true }));
console.log('    内部 span 现在是：' + c1._shadowRoot.querySelector('span').textContent);
console.log('');

console.log('⑥ 从文档移除 → disconnectedCallback：');
c1.remove();
console.log('');

// ===========================================================================
// 第 5 部分：延迟升级
// ===========================================================================

section('--- 4. 延迟升级：元素先出现，组件类后定义 ---');

console.log('先往文档里放一个还没定义的 <my-badge>：');
const early = doc.createElement('my-badge');
early.setAttribute('level', 'high');
early.textContent = '未定义的标签就这样显示为普通行内元素';
doc.body.appendChild(early);
console.log('  此时 registry.get("my-badge") =', registry.get('my-badge'));
console.log('  isConnected =', early.isConnected, '（它就是个普通元素，什么行为都没有）');
console.log('');

console.log('现在才定义它：');
class MyBadge extends MiniHTMLElement {
  static get observedAttributes() {
    return ['level'];
  }

  constructor() {
    super();
    this.tagName = 'MY-BADGE';
    console.log('    [MyBadge] constructor()：注意——它是在 define() 的那一刻才被调用的');
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<span class="dot">●</span><slot>默认文字</slot>';
  }

  connectedCallback() {
    console.log('    [MyBadge] connectedCallback()：升级后补发的');
  }

  attributeChangedCallback(name, oldV, newV) {
    console.log(`    [MyBadge] attributeChangedCallback('${name}', ${JSON.stringify(oldV)}, ${JSON.stringify(newV)})`);
  }
}

registry.define('my-badge', MyBadge);
console.log('  升级日志：' + registry._upgradeLog.join('；'));
const upgraded = doc.body.querySelectorAll('my-badge')[0];
console.log('  升级后的元素 instanceof MyBadge =', upgraded instanceof MyBadge);
console.log('  它的 shadow 树 =', upgraded._shadowRoot.innerHTML);
console.log('  whenDefined 也能拿到类：', (await registry.whenDefined('my-badge')).name);
console.log('');

// ===========================================================================
// 第 6 部分：Shadow DOM 与样式隔离
// ===========================================================================

section('--- 5. Shadow DOM：样式隔离实证 ---');

class MyPanel extends MiniHTMLElement {
  constructor() {
    super();
    this.tagName = 'MY-PANEL';
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      '<style>p{color:red} button{padding:20px}</style>' + '<p class="inner">我是 shadow 里的 p</p>' + '<button>我是 shadow 里的 button</button>';
  }
}

class MyClosedPanel extends MiniHTMLElement {
  constructor() {
    super();
    this.tagName = 'MY-CLOSED-PANEL';
    // mode: 'closed' —— 外部拿不到 el.shadowRoot
    this.attachShadow({ mode: 'closed' }).innerHTML = '<p>closed 模式内部</p>';
  }
}

registry.define('my-panel', MyPanel);
registry.define('my-closed-panel', MyClosedPanel);

// 页面（light DOM）里也有同名的 p 与 button
doc.body.innerHTML = '';
parseHTML(doc.body, '<p class="outer">我是页面上的 p</p><button>页面上的按钮</button>');
const panel = doc.createElement('my-panel');
doc.body.appendChild(panel);

console.log('页面（light DOM）结构 = ' + doc.body.innerHTML);
console.log('组件内部（shadow 树）  = ' + panel._shadowRoot.innerHTML);
console.log('');
console.log('实证 ①：外部的选择器选不中 shadow 内部');
console.log('  document.querySelectorAll("p")        → ' + doc.body.querySelectorAll('p').length + ' 个（只有页面自己的那个）');
console.log('  document.querySelectorAll("button")   → ' + doc.body.querySelectorAll('button').length + ' 个');
console.log('  panel.shadowRoot.querySelectorAll("p") → ' + panel._shadowRoot.querySelectorAll('p').length + ' 个（只有组件内部的那个）');
console.log('  两棵树彻底隔离：外部那条 p{color:red} 规则永远作用不到 shadow 里的 p。');
console.log('');
console.log('实证 ②：:host 用来给宿主自己写样式');
const hostRule = doc.body.querySelectorAll('my-panel');
console.log('  shadow 树里写 :host { display:block } 只会作用在宿主 <my-panel> 上，不影响其内部结构。');
console.log('  宿主在 light DOM 里的匹配：' + (hostRule.length ? 'my-panel 匹配成功' : '没找到'));
console.log('');
console.log('实证 ③：closed 模式');
const closedPanel = doc.createElement('my-closed-panel');
doc.body.appendChild(closedPanel);
console.log('  closedPanel.shadowRoot = ' + closedPanel.shadowRoot + '（外部拿不到）');
console.log('  但内部依然是活的：closedPanel._shadowRoot = ' + closedPanel._shadowRoot.querySelector('p').textContent);
console.log('  → closed 只是"不给你看"，不是安全边界：构造函数里留个引用照样能拿到。');
console.log('');

// ===========================================================================
// 第 7 部分：template 与 slot
// ===========================================================================

section('--- 6. <template> + <slot>：结构模板与内容分发 ---');

// 浏览器里 template 写在 HTML 里，这里用字符串代替
const tpl = doc.createElement('template');
tpl._setTemplateHTML(
  '<style>.name{font-weight:bold} .box{border:1px solid #ccc}</style>' +
    '<div class="box">' +
    '<slot name="avatar">（默认头像）</slot>' +
    '<span class="name"><slot name="name">匿名用户</slot></span>' +
    '<div class="body"><slot>（没有提供正文）</slot></div>' +
    '</div>',
);
console.log('<template> 的 content 结构（不会被渲染，只是一份"惰性"的树）：');
console.log('  ' + tpl.content.innerHTML);
console.log('  注意 slot 之间的文字是"后备内容"：没有任何内容被分配进来时才会显示。');
console.log('');

class UserCard extends MiniHTMLElement {
  constructor() {
    super();
    this.tagName = 'USER-CARD';
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(tpl.content.cloneNode(true)); // 每次都克隆一份，组件之间互不影响
  }

  /** 具名插槽的分配结果 */
  assignedNodes(slotName) {
    const slot = this._shadowRoot.querySelectorAll('slot').find((s) => (s.getAttribute('name') || '') === (slotName ?? ''));
    if (!slot) return [];
    const host = this;
    return host.childNodes.filter((c) => (c.getAttribute ? c.getAttribute('slot') || '' : '') === (slotName ?? ''));
  }
}

registry.define('user-card', UserCard);

const card = doc.createElement('user-card');
const avatar = doc.createElement('span');
avatar.setAttribute('slot', 'avatar');
avatar.setAttribute('class', 'avatar');
avatar.textContent = '😀';
const name = doc.createElement('b');
name.setAttribute('slot', 'name');
name.textContent = '张三';
const body = doc.createElement('p');
body.textContent = '这段没有 slot 属性，会进入默认插槽。';
card.appendChild(avatar);
card.appendChild(name);
card.appendChild(body);
doc.body.appendChild(card);

console.log('宿主的 light DOM（写在 <user-card> 标签里的内容）：');
console.log('  ' + card.textContent.replace(/\s+/g, ' ').trim());
console.log('组件内部的 shadow 树（结构模板）：');
console.log('  ' + card._shadowRoot.innerHTML.slice(0, 110) + '...');
console.log('');
console.log('分配结果（谁进了哪个插槽）：');
for (const [slotName, nodes] of [
  ['avatar', [avatar]],
  ['name', [name]],
  ['（默认）', [body]],
]) {
  console.log(`  slot="${slotName}" → ${nodes.map((n) => n.tagName.toLowerCase() + '：' + n.textContent).join(', ')}`);
}
console.log('');
console.log('② 不提供任何内容时，显示的是 slot 的后备内容：');
const bare = doc.createElement('user-card');
doc.body.appendChild(bare);
console.log('  bare.textContent = ' + JSON.stringify(bare.textContent) + ' ← 宿主自己没有子节点，所以是空串');
console.log('  bare._shadowRoot.innerHTML 里带着后备文字：' + /默认头像/.test(bare._shadowRoot.innerHTML));
console.log('  也就是：插槽里真正显示出来的是"后备内容"，直到有内容被分配进去。');
console.log('');
console.log('③ 两个实例各持一份克隆出来的模板，互不影响');
console.log('  两棵 shadow 树是不同对象：', card._shadowRoot !== bare._shadowRoot);
console.log('  改动前 bare 内部 .name 的文本 = ' + JSON.stringify(bare._shadowRoot.querySelector('.name').textContent));
card._shadowRoot.querySelector('.name').textContent = '（我改了 card 的内部节点）';
console.log('  改动后 card 内部 .name 的文本 = ' + card._shadowRoot.querySelector('.name').textContent);
console.log('  改动后 bare 内部 .name 的文本 = ' + JSON.stringify(bare._shadowRoot.querySelector('.name').textContent) + ' ← 没受影响');
console.log('');

// ===========================================================================
// 第 8 部分：事件跨 shadow 边界
// ===========================================================================

section('--- 7. 事件跨边界：bubbles / composed / 重定向 ---');

const logBody = [];
doc.body.addEventListener('ping', (e) => {
  logBody.push('body 收到 ping，event.target = ' + (e.target.tagName ? e.target.tagName.toLowerCase() : '?'));
});
const logShadowHost = [];
class MyPinger extends MiniHTMLElement {
  constructor() {
    super();
    this.tagName = 'MY-PINGER';
    this.attachShadow({ mode: 'open' }).innerHTML = '<em class="inner">点我</em>';
    // shadow 树内部也监听，用来展示"内外看到的 target 不一样"
    this._shadowRoot.addEventListener('ping', (e) => {
      logShadowHost.push('shadow 内部收到 ping，event.target = ' + (e.target.tagName ? e.target.tagName.toLowerCase() : '?'));
    });
  }
}
registry.define('my-pinger', MyPinger);

const pinger = doc.createElement('my-pinger');
doc.body.appendChild(pinger);
const inner = pinger._shadowRoot.querySelector('em');

console.log('① composed: false（默认）—— 事件出不了 shadow 边界：');
logBody.length = 0;
logShadowHost.length = 0;
inner.dispatchEvent(new MiniEvent('ping', { bubbles: true, composed: false }));
console.log('  ' + (logShadowHost[0] || '（shadow 内部没收到）'));
console.log('  body 侧：' + (logBody.length === 0 ? '什么都没收到 ← 这就是最常见的"组件发了事件但外面监听不到"' : logBody.join('；')));
console.log('');

console.log('② composed: true —— 事件穿过 shadow 边界，一直冒泡到 body：');
logBody.length = 0;
logShadowHost.length = 0;
inner.dispatchEvent(new MiniEvent('ping', { bubbles: true, composed: true }));
console.log('  ' + (logShadowHost[0] || '（shadow 内部没收到）'));
console.log('  ' + (logBody[0] || '（body 没收到）'));
console.log('  → 同一个事件，shadow 内部看到的 target 是 <em>，外部看到的却是 <my-pinger>。');
console.log('    这就是**事件重定向（retargeting）**：封装了内部结构，外面只知道是哪个组件发的。');
console.log('');

console.log('③ composedPath() 能看到完整的传播路径：');
/** 给路径上的节点起个可读名字 */
const label = (n) => (n.nodeType === 11 ? '#shadow-root' : n.nodeType === 9 ? '#document' : n.tagName.toLowerCase());
const probe = new MiniEvent('ping', { bubbles: true, composed: true });
probe._originalTarget = inner;
console.log('  ' + probe.composedPath().map(label).join(' → '));
console.log('  对比 composed: false 的路径：');
const probe2 = new MiniEvent('ping', { bubbles: true, composed: false });
probe2._originalTarget = inner;
console.log('  ' + probe2.composedPath().map(label).join(' → '));
console.log('  非 composed 的路径到 #shadow-root 就断了 —— 所以宿主和它的祖先都收不到。');
console.log('');

console.log('④ bubbles: false 时，连祖先都收不到（和普通 DOM 一致）：');
logBody.length = 0;
inner.dispatchEvent(new MiniEvent('ping', { bubbles: false, composed: true }));
console.log('  body 侧：' + (logBody.length === 0 ? '没收到（没冒泡）' : logBody.join('；')));
console.log('  注意：bubbles 管的是"向上升级"，composed 管的是"能不能穿过 shadow 边界"，' + '两者是独立的两个开关。');

// ===========================================================================
// 第 9 部分：与框架组件化的关系
// ===========================================================================

section('--- 8. 与框架组件化的关系 ---');

const rows = [
  ['结构封装', 'render 出来的虚拟 DOM 由框架管理', 'Shadow DOM 由浏览器强制隔离，外部选择器进不去'],
  ['样式封装', 'CSS Modules / styled-components / scoped', '原生隔离：外部 CSS 选不中内部，内部样式也漏不出去'],
  ['行为封装', '组件类 / 函数组件 + 生命周期', 'class extends HTMLElement + 四个生命周期回调'],
  ['复用方式', 'import 组件再在模板里使用', '把标签扔进 HTML 就能用，甚至不需要 JS 代码参与'],
  ['跨框架', '需要适配层或重写', '浏览器原生，React / Vue / Angular / 原生页面都能直接用'],
  ['数据传递', 'props / emits（编译期 + 运行时约定）', 'HTML 属性（只传字符串）+ DOM 属性 + CustomEvent'],
  ['生态与工具', '极其成熟：路由、状态、SSR、DevTools', '原生能力，SSR、响应式、状态管理要自己搭'],
];
for (const [dim, fw, wc] of rows) {
  console.log('· ' + dim);
  console.log('    框架组件：' + fw);
  console.log('    Web 组件：' + wc);
}
console.log('');
console.log('结论：');
console.log('  1) Web Components 是"原生组件"，最大价值是**跨框架复用**：');
console.log('     一个用原生写的 <date-picker>，在 React、Vue、老 jQuery 页面里都能直接用。');
console.log('  2) 它没有解决"状态管理 / 响应式 / 服务端渲染"这些框架级问题，');
console.log('     所以真实项目里常见的是"框架 + 少量原生组件"混用，而不是二选一。');
console.log('  3) 设计系统（Design System）是最典型的场景：');
console.log('     基础组件用 Web Components 写一份，所有技术栈的产品线共享。');
console.log('');
console.log('浏览器里三件套的写法（把 Mini 前缀去掉就是真实代码）：');
console.log('  class MyCard extends HTMLElement {');
console.log('    static observedAttributes = ["title"];');
console.log('    constructor() { super(); this.attachShadow({ mode: "open" }); }');
console.log('    connectedCallback() { /* 插入文档 */ }');
console.log('    attributeChangedCallback(n, o, v) { /* 属性变化 */ }');
console.log('  }');
console.log('  customElements.define("my-card", MyCard);');
console.log('');
console.log('程序结束。');
