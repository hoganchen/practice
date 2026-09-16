/**
 * ============================================================================
 * 知识点：DOM 查询与操作（Node 端用对象树模拟 DOM 遍历）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js（对象）、14_classes/01_class_basics.js（类）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    DOM（Document Object Model，文档对象模型）是浏览器把 HTML 解析成的一棵
 *    "节点树"。页面上的每个标签都是树上的一个对象（节点），JS 通过操作这些
 *    对象来改变页面。要操作节点，第一步永远是"找到它"，这就是 DOM 查询。
 *
 * 2. 为什么需要
 *    HTML 一旦被解析完就是静态的。用户点击、输入、数据变化后想更新界面，
 *    就必须先"定位到要改的那个节点"，再改它的属性/内容/结构。
 *    查询（querySelector / querySelectorAll）与增删（createElement / appendChild /
 *    remove）是前端最基础、使用频率最高的两组 API。
 *
 * 3. 核心语法要点
 *    - document.querySelector(选择器)：返回第一个匹配的元素（Element 或 null）。
 *    - document.querySelectorAll(选择器)：返回静态的 NodeList（不是数组，但有 length、
 *      可 for...of、可用 Array.from 转成真数组）。
 *    - 选择器语法与 CSS 完全一致：'div'、'#id'、'.class'、'ul > li'、'a[href]'、
 *      '.card .title'（后代）、'.a, .b'（分组）。
 *    - 遍历属性：parentNode / children / firstElementChild / nextElementSibling /
 *      closest（向上找最近的匹配祖先）/ contains（是否包含某后代）/ matches（自身是否匹配）。
 *    - 创建与插入：document.createElement(tag)、parent.appendChild(child)、
 *      parent.insertBefore(newNode, refNode)、node.before() / after() / replaceWith() / remove()。
 *    - 内容读写：textContent（纯文本，安全）、innerHTML（HTML 字符串，会解析标签）、
 *      setAttribute / getAttribute / classList。
 *
 * 4. 常见陷阱
 *    - querySelector 找不到时返回 null，紧接着读取它的属性会抛
 *      "Cannot read properties of null"。必须先判空。
 *    - querySelectorAll 返回的 NodeList 虽然能用 forEach，但没有 map / filter，
 *      想用数组方法要先 Array.from() 或 [...nodeList]。
 *    - 选择器写错（比如 .card 写成了 card）不会报错，只会静默返回 null/空集合。
 *    - DOM 是"活的"：插入到页面后，节点对象上的 parentNode / 兄弟关系会立刻更新。
 *
 * 【本文件在 Node 中如何演示】
 *    Node.js 里没有 document、没有 HTML 解析器，所以本文件用普通的 JS 对象
 *    手动搭出一棵树（Element 类），再自己实现 querySelector / querySelectorAll /
 *    appendChild / closest 等方法的算法。浏览器中这些方法由引擎用 C++ 实现，
 *    但"选择器匹配 + 树遍历"的算法思想是完全一样的——这正是本文件要展示的。
 *
 * 【运行方法】
 *   node 27_web_apis/01_dom_query.js
 *
 * 【预期输出】
 *   打印一棵模拟 DOM 树的结构，以及 querySelector/querySelectorAll 的各种查询结果、
 *   节点遍历结果和插入/删除节点前后的树结构对比。
 * ============================================================================
 */

// ===========================================================================
// 第 0 部分：用对象树模拟 DOM
// ===========================================================================

/**
 * 模拟 DOM 中的元素节点（Element）。
 * 真实 DOM 节点有几十个属性和几百个方法，这里只保留教学必需的最小集合。
 */
class Element {
  /**
   * @param {string} tagName 标签名，如 'div'
   * @param {object} [attributes] 属性对象，如 { id: 'app', class: 'card hot' }
   */
  constructor(tagName, attributes = {}) {
    this.tagName = tagName.toUpperCase(); // 真实 DOM 中 tagName 一律大写
    this.attributes = { ...attributes }; // 属性表（id、class、href 等）
    this.childNodes = []; // 子节点数组
    this.parentNode = null; // 父节点引用（指向父节点的"指针"）
    this._text = ''; // 直接写在本节点里的文本（相当于文本子节点）
  }

  // --------------------------------------------------------------------
  // 常用属性（getter）：模拟 DOM 的同名属性
  // --------------------------------------------------------------------

  /** id：取自 attributes.id，没有则返回空字符串（与真实 DOM 一致） */
  get id() {
    return this.attributes.id || '';
  }

  /** className：类名字符串 */
  get className() {
    return this.attributes.class || '';
  }

  /** classList：把 className 按空白切成数组，方便判断 */
  get classList() {
    return this.className.split(/\s+/).filter(Boolean);
  }

  /**
   * textContent：
   * 真实 DOM 中它返回"本节点及所有后代节点的纯文本拼接"。
   * 这里用递归把整棵子树拼起来。
   */
  get textContent() {
    return this._text + this.childNodes.map((c) => c.textContent).join('');
  }

  /** 给 textContent 赋值 = 清空所有子节点，只留一段纯文本 */
  set textContent(value) {
    this.childNodes = [];
    this._text = String(value);
  }

  /** insertBefore/appendChild 等方法的别名，让 API 名字与浏览器一致 */
  get children() {
    return this.childNodes;
  }

  get firstElementChild() {
    return this.childNodes[0] || null;
  }

  /** nextElementSibling：同一父节点下、排在后面的兄弟节点 */
  get nextElementSibling() {
    if (!this.parentNode) return null;
    const siblings = this.parentNode.childNodes;
    const i = siblings.indexOf(this);
    return i >= 0 && i + 1 < siblings.length ? siblings[i + 1] : null;
  }

  // --------------------------------------------------------------------
  // 结构操作方法
  // --------------------------------------------------------------------

  /** appendChild：把节点挂到本节点末尾，返回被插入的节点 */
  appendChild(node) {
    if (node.parentNode) node.parentNode.removeChild(node); // 先脱离原父节点（DOM 同一节点只能有一个父节点）
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  /** insertBefore：把 node 插到 refNode 之前（refNode 为 null 时等同于 appendChild） */
  insertBefore(node, refNode) {
    if (refNode == null) return this.appendChild(node);
    const i = this.childNodes.indexOf(refNode);
    if (i === -1) throw new Error('insertBefore: 参照节点不是本节点的子节点');
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.splice(i, 0, node);
    return node;
  }

  /** removeChild：移除子节点 */
  removeChild(node) {
    const i = this.childNodes.indexOf(node);
    if (i === -1) throw new Error('removeChild: 该节点不是本节点的子节点');
    this.childNodes.splice(i, 1);
    node.parentNode = null;
    return node;
  }

  /** remove：把自己从父节点上摘下来（对应 element.remove()） */
  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  /**
   * contains：判断 other 是否是自己的后代（含自身）
   * 真实 DOM 中这是一个常用的"事件委托范围判断"工具。
   */
  contains(other) {
    if (other === this) return true;
    return this.childNodes.some((c) => c.contains(other));
  }

  /**
   * closest：从自身开始向上找，返回最近一个匹配选择器的祖先（含自身）
   * 找不到返回 null。浏览器中常用于事件委托里定位"我该处理哪个卡片"。
   */
  closest(selector) {
    let node = this;
    while (node) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  /** matches：判断自身是否匹配某个简单/复合选择器 */
  matches(selector) {
    return selector.split(',').some((part) => {
      const { parts, seps } = parseComplexSelector(part);
      return matchesChain(this, parts, seps, parts.length - 1);
    });
  }

  /** 把整棵子树序列化成 HTML 字符串，方便打印观察 */
  toString() {
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    const inner = this._text + this.childNodes.map((c) => c.toString()).join('');
    return `<${this.tagName.toLowerCase()}${attrs}>${inner}</${this.tagName.toLowerCase()}>`;
  }

  /** 以缩进树的形式打印结构，用于直观地"看见"这棵树 */
  toTreeString(indent = 0) {
    const pad = '  '.repeat(indent);
    const attrs = Object.entries(this.attributes)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');
    const text = this._text ? ` "${this._text}"` : '';
    const lines = [`${pad}<${this.tagName.toLowerCase()}${attrs}>${text}`];
    for (const child of this.childNodes) lines.push(child.toTreeString(indent + 1));
    return lines.join('\n');
  }
}

/**
 * 模拟 document 对象：树的入口，提供查询与创建方法。
 */
class Document {
  constructor(root) {
    this.documentElement = root;
  }

  /** createElement：创建一个游离（还没插入树中）的节点 */
  createElement(tagName) {
    return new Element(tagName);
  }

  /** querySelector：深度优先遍历，返回第一个匹配的元素；找不到返回 null */
  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  /**
   * querySelectorAll：返回所有匹配元素。
   * 真实 DOM 返回的是静态 NodeList（快照），这里用普通数组模拟，
   * 语义一致：之后树再怎么变，这个结果集合不会跟着变。
   */
  querySelectorAll(selector) {
    const selectors = selector.split(',').map((s) => s.trim());
    const result = [];
    // 深度优先遍历整棵树，逐个判断是否匹配任一选择器
    const walk = (node) => {
      for (const child of node.childNodes) {
        if (selectors.some((sel) => child.matches(sel))) {
          // 去重：同一个元素可能同时匹配多个选择器分组
          if (!result.includes(child)) result.push(child);
        }
        walk(child);
      }
    };
    walk(this.documentElement);
    return result;
  }
}

// ---------------------------------------------------------------------------
// 选择器引擎：把 CSS 选择器解析成"简单选择器链"
// ---------------------------------------------------------------------------

/** 解析单个简单选择器，如 'li.item.hot' → { tag:'li', id:'', classes:['item','hot'] } */
function parseSimpleSelector(text) {
  const tagMatch = text.match(/^[a-zA-Z*][\w-]*/);
  const idMatch = text.match(/#([\w-]+)/);
  const classMatches = text.match(/\.[\w-]+/g) || [];
  return {
    tag: tagMatch ? tagMatch[0].toUpperCase() : null, // null 表示未指定标签（等价于 *）
    id: idMatch ? idMatch[1] : null,
    classes: classMatches.map((c) => c.slice(1)),
  };
}

/** 判断一个元素是否匹配"单个简单选择器" */
function matchesSimple(el, text) {
  const { tag, id, classes } = parseSimpleSelector(text);
  if (tag && tag !== '*' && el.tagName !== tag) return false;
  if (id && el.id !== id) return false;
  if (!classes.every((c) => el.classList.includes(c))) return false;
  return true;
}

/**
 * 把复合选择器拆成 [简单选择器数组] + [连接符数组]
 * 例：'div > ul li.hot' → parts=['div','ul','li.hot'] seps=['>',' ']
 */
function parseComplexSelector(selector) {
  const parts = [];
  const seps = [];
  const re = /\s*(>)?\s*([^\s>]+)/g;
  let m;
  while ((m = re.exec(selector)) !== null) {
    if (parts.length > 0) seps.push(m[1] ? '>' : ' '); // '>' 子代；' ' 后代
    parts.push(m[2]);
  }
  return { parts, seps };
}

/**
 * 从右往左递归匹配选择器链。
 * end 表示当前要匹配的下标（从右往左推进）。
 * 这是浏览器选择器引擎的核心思路：先看最右边的元素，再向左验证祖先关系。
 */
function matchesChain(el, parts, seps, end) {
  if (!el || !matchesSimple(el, parts[end])) return false;
  if (end === 0) return true; // 链头也匹配上了，整条链成立
  const combinator = seps[end - 1];
  if (combinator === '>') {
    // 子代选择器：必须恰好是直接父节点
    return matchesChain(el.parentNode, parts, seps, end - 1);
  }
  // 后代选择器：任意一层祖先匹配即可
  let p = el.parentNode;
  while (p) {
    if (matchesChain(p, parts, seps, end - 1)) return true;
    p = p.parentNode;
  }
  return false;
}

// ===========================================================================
// 第 1 部分：搭一棵树（相当于浏览器解析 HTML 的结果）
// ===========================================================================

console.log('--- 1. 手工搭建一棵模拟 DOM 树 ---');

const doc = new Document(new Element('html'));
const body = doc.documentElement.appendChild(new Element('body'));

const app = body.appendChild(new Element('div', { id: 'app', class: 'container' }));
const title = app.appendChild(new Element('h1', { class: 'title' }));
title.textContent = '待办清单';

const list = app.appendChild(new Element('ul', { id: 'list' }));
// 用循环生成 3 个 li，模拟"数据驱动视图"
[
  { text: '学习 DOM 查询', cls: 'item done' },
  { text: '理解树结构', cls: 'item' },
  { text: '实现选择器引擎', cls: 'item hot' },
].forEach(({ text, cls }) => {
  const li = list.appendChild(new Element('li', { class: cls }));
  li.textContent = text;
});

const desc = app.appendChild(new Element('p', { class: 'desc' }));
desc.textContent = '共 3 条记录';

console.log('树的缩进结构：');
console.log(doc.documentElement.toTreeString());
console.log('');

// ===========================================================================
// 第 2 部分：querySelector / querySelectorAll
// ===========================================================================

console.log('--- 2. querySelector：只取第一个匹配项 ---');

console.log('querySelector("li")        →', doc.querySelector('li').textContent);
console.log('querySelector("#list")     →', doc.querySelector('#list').tagName);
console.log('querySelector(".hot")      →', doc.querySelector('.hot').textContent);
console.log('querySelector("li.done")   →', doc.querySelector('li.done').textContent);
console.log('querySelector("#nope")    →', doc.querySelector('#nope'), '（找不到返回 null 而不是报错）');
console.log('');

console.log('--- 3. querySelectorAll：取全部匹配项（静态快照） ---');

const items = doc.querySelectorAll('li');
console.log('querySelectorAll("li") 数量 =', items.length);
console.log('各项文本 =', items.map((el) => el.textContent));

// 复合选择器：后代 + 子代 + 分组
console.log('"ul li"        →', doc.querySelectorAll('ul li').length, '个');
console.log('"#app > ul"    →', doc.querySelectorAll('#app > ul').length, '个');
console.log('"h1, .desc"    →', doc.querySelectorAll('h1, .desc').map((e) => e.tagName));
console.log('"ul > li.hot"  →', doc.querySelectorAll('ul > li.hot').map((e) => e.textContent));
console.log('"body li"      →', doc.querySelectorAll('body li').length, '个（后代可以跨多层）');
console.log('');

console.log('--- 4. 陷阱：选择器写错不会报错，只会静默返回空 ---');
const wrong = doc.querySelectorAll('lis'); // 少写了一个字母
console.log('querySelectorAll("lis") 数量 =', wrong.length, '（拼错的选择器不报错，只是匹配不到）');
console.log('');

// ===========================================================================
// 第 3 部分：节点之间的遍历
// ===========================================================================

console.log('--- 5. 在树中"上下左右"移动 ---');

const hotItem = doc.querySelector('.hot');
console.log('起点：', hotItem.textContent);
console.log('parentNode.tagName        →', hotItem.parentNode.tagName);
console.log('parentNode.id             →', hotItem.parentNode.id);
console.log('前一个兄弟（手动取）      →', hotItem.parentNode.childNodes[1].textContent);
console.log('firstElementChild         →', list.firstElementChild.textContent);
console.log('子节点个数 children.length →', list.children.length);
console.log('')

console.log('--- 6. closest / contains / matches：事件委托的三大工具 ---');
console.log('hotItem.closest("ul").id  →', hotItem.closest('ul').id, '（沿祖先链向上找到 ul）');
console.log('hotItem.closest("#app").id→', hotItem.closest('#app').id);
console.log('hotItem.matches("li.hot") →', hotItem.matches('li.hot'));
console.log('title.matches("li.hot")   →', title.matches('li.hot'));
console.log('app.contains(hotItem)     →', app.contains(hotItem), '（hotItem 确实是 app 的后代）');
console.log('title.contains(hotItem)   →', title.contains(hotItem), '（但不在 title 里面）');
console.log('');

// ===========================================================================
// 第 4 部分：创建、插入、删除节点
// ===========================================================================

console.log('--- 7. 动态新增一条待办（createElement + appendChild） ---');
const newItem = doc.createElement('li');
newItem.attributes.class = 'item';
newItem.textContent = '新增：动态创建节点';
list.appendChild(newItem);
console.log('插入后 li 数量 =', doc.querySelectorAll('li').length);
console.log('新增项文本 =', doc.querySelector('#list').children.at(-1).textContent);

console.log('');
console.log('--- 8. insertBefore：插到指定节点之前 ---');
const urgent = doc.createElement('li');
urgent.attributes.class = 'item hot';
urgent.textContent = '【加急】插到第一位';
list.insertBefore(urgent, list.firstElementChild);
console.log('插入后第一项 =', list.firstElementChild.textContent);
console.log('列表顺序 =', doc.querySelectorAll('#list > li').map((e) => e.textContent));

console.log('');
console.log('--- 9. remove：删除节点，树会立刻更新 ---');
const doneItem = doc.querySelector('li.done');
doneItem.remove();
console.log('删除后的列表顺序 =', doc.querySelectorAll('#list > li').map((e) => e.textContent));
console.log('被删节点的 parentNode 已变为 =', doneItem.parentNode, '（脱离了树）');

console.log('');
console.log('--- 10. 操作后的完整树 ---');
console.log(doc.documentElement.toTreeString());

console.log('');
console.log('说明：以上查询/遍历/增删的算法，在浏览器中由引擎用 C++ 实现，');
console.log('      但 API 语义与这里完全一致——换到浏览器里，同样的代码只需把');
console.log('      doc 换成 document 即可直接运行。');
