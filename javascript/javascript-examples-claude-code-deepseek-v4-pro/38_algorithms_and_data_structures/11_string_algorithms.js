/**
 * ============================================================================
 * 知识点：字符串算法 —— Trie 前缀树、KMP 与滚动哈希
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】高级
 * 【前置知识】38_algorithms_and_data_structures/05_binary_search_tree.js
 *            38_algorithms_and_data_structures/07_graph_traversal.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字符串算法要解决的是三类最典型的问题：
 *
 *      ① 前缀检索：给一堆词，快速回答"有没有以 xxx 开头的词"（搜索建议、路由匹配）；
 *      ② 模式匹配：在一段长文本里找一段短模式（Ctrl+F、日志过滤、DNA 序列比对）；
 *      ③ 子串判等 / 去重：判断两个长串是否相同、找出重复内容（查重、抄袭检测）。
 *
 *    本示例各给一个代表算法：
 *
 *      Trie（前缀树，读作 "try"）→ 问题①，把"前缀"变成树上的路径
 *      KMP（Knuth-Morris-Pratt）→ 问题②，用"失败函数"跳过不可能的对齐位置
 *      Rabin-Karp（滚动哈希）→ 问题②③，把字符串比较降级成数字比较
 *
 * 2. 为什么需要（真实项目场景）
 *    · 搜索建议 / 自动补全：输入 "jav" 立刻列出 "java""javascript""java虚拟机" ——
 *      这是 Trie 最广为人知的用途（搜索引擎、IDE 补全、输入法）。
 *    · 路由匹配：Express / Koa 的 URL 路由表就是一棵前缀树，
 *      '/users/:id/posts' 这种带参数的路径也挂在树上（本示例给出简化实现）。
 *    · 敏感词过滤 / 广告词替换：把几万个敏感词建成 Trie，扫一遍文本 O(文本长度)。
 *    · 字符串 Ctrl+F：编辑器用 KMP / Boyer-Moore / 滚动哈希，在几 MB 文件里瞬间定位。
 *    · 抄袭检测 / 查重：把文档切成片段做滚动哈希，比对哈希值就能找出重复段落。
 *    · 生物信息学：DNA 序列（只有 A/C/G/T 四个字母）的比对，Trie 和 KMP 都是主力工具。
 *    · 分布式系统：一致性哈希、数据分片常把"字符串 → 数字"的滚动哈希当基础构件。
 *
 * 3. 核心语法要点 / 算法思想
 *    · Trie 的本质：把"公共前缀"合并成一条公共路径。存 {cat, car, card, dog}
 *      只要 8 个节点，而 4 个独立字符串要存 11 个字符 —— 前缀越长，省得越多。
 *      查询和插入的代价都是 O(词长)，与【词典里有多少词无关】—— 这是它最强的地方。
 *    · KMP 的本质：利用"模式串自己和自己匹配"的信息。
 *      暴力匹配失败时只能把模式串右移一位、从头再比，白白重复比较了已知相同的前缀；
 *      KMP 事先算出"每个位置失败后应该跳到哪"（失败函数 / next 数组），
 *      一次不回退地扫完文本，把 O(n × m) 变成 O(n + m)。
 *    · 滚动哈希的本质：把字符串当成一个 BASE 进制的大数，取模得到一个指纹。
 *      相邻窗口的哈希可以 O(1) 地"滚"出来，于是每次比较从 O(m) 变成 O(1)（期望）。
 *      Rabin-Karp 就是"滚动哈希 + 冲突时再逐字符确认"。
 *
 * 4. 常见陷阱
 *    - 陷阱一：Trie 用普通对象存子节点。对象的键会被转成字符串，
 *      如果字符集包含数字或特殊符号，会出现难以排查的键冲突（本示例用 Map）。
 *    - 陷阱二：忘记标记"词的结尾"。没有 isEnd 标记，Trie 无法区分
 *      "词典里有 app" 和 "词典里只有 apple"（两者的路径完全一样）。
 *    - 陷阱三：KMP 的 next 数组定义五花八门（有的存长度、有的存下标、有的整体右移一位），
 *      不同定义下代码差一行就全错。关键是【自己要统一】，本示例用最常见的一种：
 *      next[i] = 子串 pattern[0..i] 的"最长相等真前缀真后缀"长度。
 *    - 陷阱四：以为 KMP 永远比暴力快。在随机文本上 KMP 常常【更慢】——
 *      因为绝大多数失配都发生在第 1~2 个字符，暴力匹配此时几乎没有浪费，
 *      而 KMP 多花了预处理和跳转的开销（本示例会实测出这个反直觉的结论）。
 *    - 陷阱五：滚动哈希的取模运算。减法可能得到负数，必须 (x % MOD + MOD) % MOD。
 *    - 陷阱六：用 JS 的 Number 做滚动哈希的乘法溢出。数值超过 2⁵³ 会丢精度，
 *      BASE 和 MOD 都要选得足够小（本示例取 BASE=256、MOD≈10⁹，乘积约 2.5×10¹¹，安全）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/11_string_algorithms.js
 *
 * 【预期输出】
 *   打印 7 个小节：Trie 的结构与构建过程、搜索建议（自动补全）、
 *   基于 Trie 的路由匹配、KMP 的失败函数推导、KMP vs 暴力匹配的实测对比、
 *   滚动哈希（Rabin-Karp）的原理与实测、以及三种算法的复杂度对照表。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用工具
// ---------------------------------------------------------------------------

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function medianMs(fn, rounds = 3) {
  fn();
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

const sink = { value: 0 };

/** 可复现的伪随机数（线性同余），保证每次运行输出一致 */
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
}

// ---------------------------------------------------------------------------
// 1. Trie 前缀树：结构、插入、查找
// ---------------------------------------------------------------------------

console.log('--- 1. Trie 前缀树：把公共前缀合并成一条路径 ---');
console.log('');
console.log('Trie（也叫字典树、前缀树）是一棵多叉树，形状完全由"前缀"决定：');
console.log('');
console.log('  根节点是空的，【从根到某个节点的路径】拼起来就是一个前缀；');
console.log('  节点上的 isEnd 标记表示"到这里是一个完整的词"。');
console.log('');

/**
 * Trie 前缀树。
 *
 * 每个节点有两个东西：
 *   children: Map<字符, 子节点>   —— 用 Map 而不是普通对象，避免键被字符串化的坑
 *   isEnd:    boolean            —— 从根走到这里，是否构成一个完整的词
 *
 * 复杂度（m = 词长，Σ = 字符集大小）：
 *   插入 O(m)、查找 O(m)、前缀查询 O(m)
 *   ★ 与词典里有多少个词【完全无关】—— 这是 Trie 相对哈希表最大的优势：
 *     哈希表查"完整单词"也是 O(m)，但查"前缀"必须遍历所有词，是 O(词数 × m)。
 *   空间 O(总字符数) 最坏情况；实际因为有前缀共享，远小于"所有词的长度之和"。
 */
class TrieNode {
  constructor() {
    this.children = new Map();
    this.isEnd = false;
    this.freq = 0; // 这个词被插入过几次，用于按热度排序的搜索建议
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
    this.nodeCount = 1; // 根节点也算一个
    this.wordCount = 0;
  }

  /** 插入一个词：从根开始，逐个字符沿着路径走，没有的分支就新建 */
  insert(word, freq = 1) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
        this.nodeCount += 1;
      }
      node = node.children.get(ch);
    }
    if (!node.isEnd) {
      node.isEnd = true;
      this.wordCount += 1;
    }
    node.freq += freq; // 词频：搜索建议要按热度排序时用得上
    return this;
  }

  /** 沿着前缀走到对应节点，走不到就返回 null。查找和前缀查询共用这一段 */
  #walk(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      const next = node.children.get(ch);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  /** 精确查找：词典里有没有这个词（必须落在 isEnd 节点上） */
  search(word) {
    const node = this.#walk(word);
    return node !== null && node.isEnd;
  }

  /** 前缀查询：有没有以 prefix 开头的词（只要求路径存在，不要求 isEnd） */
  startsWith(prefix) {
    return this.#walk(prefix) !== null;
  }

  /** 前缀计数：以 prefix 开头的词有多少个（先走到节点，再往下数 isEnd） */
  countPrefix(prefix) {
    const node = this.#walk(prefix);
    if (!node) return 0;
    let count = 0;
    const stack = [node];
    while (stack.length > 0) {
      const cur = stack.pop();
      if (cur.isEnd) count += 1;
      for (const child of cur.children.values()) stack.push(child);
    }
    return count;
  }

  /**
   * 搜索建议（自动补全）：找出所有以 prefix 开头的词。
   *
   * 两种典型实现：
   *   · 走到前缀节点后，DFS 收集下面所有的词（本方法，输出全部候选）；
   *   · 每个节点预先缓存"下面最热门的 K 个词"，查询就是 O(词长 + K) ——
   *     真实的搜索框用的是这种（因为候选可能上百万，不可能全收集）。
   */
  completions(prefix, limit = Infinity) {
    const node = this.#walk(prefix);
    if (!node) return [];
    const out = [];
    const stack = [{ node, word: prefix }];
    while (stack.length > 0) {
      const { node: cur, word } = stack.pop();
      if (cur.isEnd) out.push({ word, freq: cur.freq });
      // Map 的插入顺序就是字典序的近似，这里为演示方便，直接按字符倒序压栈
      const entries = [...cur.children.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
      for (const [ch, child] of entries) stack.push({ node: child, word: word + ch });
    }
    return out.sort((a, b) => b.freq - a.freq || (a.word < b.word ? -1 : 1)).slice(0, limit);
  }

  /** 打印树形结构，用于演示 */
  print(limitPerLevel = 40) {
    const lines = [];
    const walk = (node, prefix, depth) => {
      const entries = [...node.children.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
      for (const [ch, child] of entries) {
        if (lines.length >= limitPerLevel) return;
        lines.push('    ' + '  '.repeat(depth) + ch + (child.isEnd ? '  ← 这是一个完整的词' : ''));
        walk(child, prefix + ch, depth + 1);
      }
    };
    walk(this.root, '', 0);
    return lines.join('\n');
  }
}

const dictWords = ['cat', 'car', 'card', 'care', 'careful', 'dog', 'do', 'dot'];
const trie = new Trie();
for (const w of dictWords) trie.insert(w);

console.log('把词典 [' + dictWords.join(', ') + '] 插入 Trie，得到的树形结构：');
console.log('');
console.log('  (root)');
console.log(trie.print());
console.log('');
console.log('  一眼就能看出 Trie 的两个关键性质：');
console.log('    ① 公共前缀只存一份：cat / car / card / care / careful 共用 "ca" 这条边；');
console.log('    ② isEnd 区分"路径"和"词"：care 和 careful 在同一条路径上，');
console.log('       走到 care 时 isEnd=true（它自己是词），继续走到 careful 又是一个词。');
console.log('');
console.log(`  词典共 ${dictWords.length} 个词、${dictWords.join('').length} 个字符，`);
console.log(`  Trie 只用了 ${trie.nodeCount} 个节点（含根），省下了 ${dictWords.join('').length + 1 - trie.nodeCount} 个节点的空间。`);
console.log('  前缀越集中，省得越多 —— 存 10 万个英文单词，实际节点数远小于字符总数。');
console.log('');
console.log('  基本操作演示（注意 search 和 startsWith 只差一个 isEnd 判断）：');
console.log('');
console.log('  操作'.padEnd(34) + '结果'.padEnd(12) + '说明');
console.log('  ' + '-'.repeat(82));
for (const [expr, result, note] of [
  ['search("cat")', trie.search('cat'), '路径存在 + isEnd=true → 是词典里的词'],
  ['search("ca")', trie.search('ca'), '路径存在但 isEnd=false → 只是个前缀，不是词'],
  ['startsWith("ca")', trie.startsWith('ca'), '路径存在 → 有以 ca 开头的词'],
  ['startsWith("cab")', trie.startsWith('cab'), '路径不存在 → 没有任何词以 cab 开头'],
  ['countPrefix("car")', trie.countPrefix('car'), 'car / card / care / careful 共 4 个'],
  ['countPrefix("d")', trie.countPrefix('d'), 'dog / do / dot 共 3 个'],
]) {
  console.log('  ' + expr.padEnd(32) + String(result).padEnd(12) + note);
}
console.log('');
console.log('  ★ 所有操作都只走了"词长"这么多步，与词典大小无关：');
console.log('    查 "careful"（7 个字符）就是 7 次 Map 查找 —— 词典里有 8 个词还是 800 万个词，');
console.log('    代价都一样。这就是 Trie 被称为"前缀检索最优解"的原因。');
console.log('');
console.log('  真实场景里的 Trie 查询有多快？用 5000 个词实测一下：');

{
  const rnd = makeRandom(20240916);
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const words = new Set();
  while (words.size < 5000) {
    const len = 3 + (rnd() % 8);
    let w = '';
    for (let i = 0; i < len; i++) w += letters[rnd() % 26];
    words.add(w);
  }
  const bigTrie = new Trie();
  for (const w of words) bigTrie.insert(w, 1 + (rnd() % 100));

  const queries = [];
  for (let i = 0; i < 20000; i++) {
    let p = '';
    const len = 1 + (rnd() % 4);
    for (let j = 0; j < len; j++) p += letters[rnd() % 26];
    queries.push(p);
  }

  // 对照组要跑"查询数 × 词数"次字符串比较，代价很高，
  // 所以只取前 2000 次查询来对比（2000 × 5000 = 1000 万次比较，已经足够说明问题）。
  const sampleQueries = queries.slice(0, 2000);

  const trieMs = medianMs(() => {
    let hits = 0;
    for (const q of queries) if (bigTrie.startsWith(q)) hits += 1;
    sink.value = hits;
  });

  // 对照组：用 Set 存所有词，然后"逐词 startsWith"来模拟哈希表的做法
  const wordArray = [...words];
  const hashMs = medianMs(() => {
    let hits = 0;
    for (const q of sampleQueries) {
      for (const w of wordArray) if (w.startsWith(q)) hits += 1;
    }
    sink.value = hits;
  }, 2);

  // Trie 那一边用同样的样本量再测一次，保证两边口径一致（免得拿 20000 次去比 2000 次）
  const trieSampleMs = medianMs(() => {
    let hits = 0;
    for (const q of sampleQueries) if (bigTrie.startsWith(q)) hits += 1;
    sink.value = hits;
  }, 2);

  console.log('');
  console.log(`    词典规模：${bigTrie.wordCount} 个词、${bigTrie.nodeCount} 个 Trie 节点，查询 ${queries.length} 次`);
  console.log(`    （下表两种做法都取前 ${sampleQueries.length} 次查询，保证口径一致）`);
  console.log('');
  console.log('    做法'.padEnd(40) + '耗时(ms)'.padEnd(12) + '每次查询的代价');
  console.log('    ' + '-'.repeat(76));
  console.log('    Trie.startsWith（走一条路径）'.padEnd(38) + trieSampleMs.toFixed(3).padEnd(12) + 'O(前缀长度)，与词数无关');
  console.log('    Set/数组逐词 startsWith（哈希表做法）'.padEnd(36) + hashMs.toFixed(3).padEnd(12) + `O(词数 × 前缀长度)`);
  console.log('');
  console.log(`    实测差距约 ${(hashMs / trieSampleMs).toFixed(0)} 倍（Trie 跑完 ${queries.length} 次只要 ${trieMs.toFixed(3)} ms）。`);
  console.log('    注意这不是"哈希表慢"，而是【哈希表根本不擅长前缀问题】：');
  console.log('    哈希表的哈希函数会把整串打散，"前缀相同"在哈希值上毫无体现，');
  console.log('    所以只能退化成逐个比对。数据结构选错了，再优化常数也没用。');
}

// ---------------------------------------------------------------------------
// 2. 搜索建议（自动补全）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 搜索建议：搜索引擎输入框背后的 Trie ---');
console.log('');
console.log('用户每敲一个键，就要立刻列出候选词，且要按热度排序。');
console.log('Trie 正好满足："走到前缀节点 + 收集子树 + 按词频排序"。');
console.log('');

const suggestTrie = new Trie();
for (const [w, f] of [
  ['java', 9500],
  ['javascript', 8800],
  ['java虚拟机', 2100],
  ['javafx', 640],
  ['java面试题', 3300],
  ['jackson', 1500],
  ['jvm', 4200],
  ['jquery', 2700],
  ['json', 7100],
  ['jwt', 1900],
]) {
  suggestTrie.insert(w, f);
}

for (const input of ['j', 'ja', 'jav', 'java', 'json', 'jz']) {
  const tips = suggestTrie.completions(input, 4);
  console.log(`  输入 "${input}"  →  ${tips.length === 0 ? '(无候选)' : tips.map((t) => `${t.word}(${t.freq})`).join('、')}`);
}
console.log('');
console.log('  注意 "ja" 和 "jav" 的结果：候选随着输入变长而收窄，');
console.log('  因为每多输入一个字符，就是沿着 Trie 多走一层，子树立刻变小。');
console.log('  输入 "jz" 直接返回空 —— 路径不存在，一次 Map 查找就否定了，');
console.log('  完全不需要扫描词典。这就是"输入法永远不卡"的原因。');
console.log('');
console.log('  ★ 工程上的关键优化：候选可能有几十万个，全收集再排序是不可接受的。');
console.log('    真实做法是在每个节点上【预存"子树里最热的 K 个词"】（K 取 5~10），');
console.log('    构建时自底向上合并一次，之后每次查询就是 O(词长 + K)。');
console.log('    这就是"用空间换时间"在 Trie 上的典型应用。');

// ---------------------------------------------------------------------------
// 3. Trie 的另一个战场：路由匹配
// ---------------------------------------------------------------------------

console.log('\n--- 3. 路由匹配：Express / Koa 的 URL 路由表也是前缀树 ---');
console.log('');
console.log('路由表长这样（冒号开头的是参数，会匹配任意一段）：');
console.log('');
console.log('    GET  /users');
console.log('    GET  /users/:id');
console.log('    GET  /users/:id/posts');
console.log('    POST /users/:id/posts');
console.log('    GET  /posts/:slug/comments');
console.log('    GET  /about');
console.log('');
console.log('  如果按顺序逐条正则匹配，1000 条路由最坏要比 1000 次；');
console.log('  把路由按【路径段】建成分层的树，匹配代价只与 URL 的段数有关，与路由条数无关。');
console.log('');
console.log('  树形结构（同一层里，静态段优先于参数段）：');
console.log('');
console.log('    (root)');
console.log('      ├── users ────┬── (●GET /users)');
console.log('      │             └── :id ──┬── (●GET /users/:id)');
console.log('      │                       └── posts ──┬── (●GET  /users/:id/posts)');
console.log('      │                                    └── (●POST /users/:id/posts)');
console.log('      ├── posts ──── :slug ──── comments ── (●GET /posts/:slug/comments)');
console.log('      └── about ──── (●GET /about)');
console.log('');
console.log('  ★ 同一个节点上可以挂多条路由，只要【HTTP 方法】不同 ——');
console.log('    所以最终匹配结果是 (节点, 方法) 这一对，而不是单个节点。');

/** 路由树的一个节点 */
class RouteNode {
  constructor() {
    this.staticChildren = new Map(); // 静态段 → 子节点，如 "users"
    this.paramChild = null; // 参数段（:xxx）→ 子节点，每层最多一个
    this.paramName = null;
    this.handlers = new Map(); // HTTP 方法 → 处理函数名
  }
}

class Router {
  constructor() {
    this.root = new RouteNode();
    this.routes = [];
  }

  /** 注册一条路由，如 add('GET', '/users/:id/posts', 'listPosts') */
  add(method, path, handler) {
    const segments = path.split('/').filter((s) => s.length > 0);
    let node = this.root;
    for (const seg of segments) {
      if (seg.startsWith(':')) {
        if (!node.paramChild) {
          node.paramChild = new RouteNode();
          node.paramName = seg.slice(1);
        }
        node = node.paramChild;
      } else {
        if (!node.staticChildren.has(seg)) node.staticChildren.set(seg, new RouteNode());
        node = node.staticChildren.get(seg);
      }
    }
    node.handlers.set(method, handler);
    this.routes.push(`${method} ${path}`);
    return this;
  }

  /**
   * 匹配一个 URL，返回 { handler, params } 或 null。
   *
   * 关键规则：静态段优先于参数段。
   * 比如同时有 /users/me 和 /users/:id，访问 /users/me 必须命中前者 ——
   * 这个"优先级"是路由库最经典的坑之一（顺序写错了，/users/me 会被 :id 抢走）。
   */
  match(method, path) {
    const segments = path.split('/').filter((s) => s.length > 0);
    const params = {};
    const node = this.#matchNode(this.root, segments, 0, params);
    if (!node || !node.handlers.has(method)) return null;
    return { handler: node.handlers.get(method), params };
  }

  #matchNode(node, segments, i, params) {
    if (i === segments.length) return node;
    // ① 先试静态分支
    const staticChild = node.staticChildren.get(segments[i]);
    if (staticChild) {
      const hit = this.#matchNode(staticChild, segments, i + 1, params);
      if (hit) return hit;
    }
    // ② 静态走不通，再试参数分支（走不通时要记得把写进去的参数删掉 —— 回溯的经典动作）
    if (node.paramChild) {
      const key = node.paramName;
      const saved = params[key];
      params[key] = segments[i];
      const hit = this.#matchNode(node.paramChild, segments, i + 1, params);
      if (hit) return hit;
      if (saved === undefined) delete params[key];
      else params[key] = saved;
    }
    return null;
  }
}

const router = new Router();
router.add('GET', '/users', 'listUsers');
router.add('GET', '/users/:id', 'getUser');
router.add('GET', '/users/:id/posts', 'listUserPosts');
router.add('POST', '/users/:id/posts', 'createUserPost');
router.add('GET', '/posts/:slug/comments', 'listComments');
router.add('GET', '/about', 'aboutPage');

console.log('');
console.log('  匹配结果：');
console.log('');
console.log('  请求'.padEnd(38) + '命中的处理函数'.padEnd(22) + '提取出的参数');
console.log('  ' + '-'.repeat(86));
for (const [method, url] of [
  ['GET', '/users'],
  ['GET', '/users/42'],
  ['GET', '/users/42/posts'],
  ['POST', '/users/42/posts'],
  ['GET', '/posts/hello-world/comments'],
  ['GET', '/about'],
  ['GET', '/users/42/settings'],
  ['DELETE', '/users/42/posts'],
]) {
  const hit = router.match(method, url);
  const paramText = hit && Object.keys(hit.params).length ? JSON.stringify(hit.params) : '(无)';
  console.log(
    `  ${(method + ' ' + url).padEnd(36)}${(hit ? hit.handler : '404 Not Found').padEnd(22)}${paramText}`,
  );
}
console.log('');
console.log('  最后两行演示了两种"没命中"：');
console.log('    · /users/42/settings —— 路径上根本没有这个分支（Trie 走到一半就断了）；');
console.log('    · DELETE /users/42/posts —— 路径存在，但这个节点上没挂 DELETE 方法。');
console.log('  路由库要区分这两种情况：前者是 404，后者是 405 Method Not Allowed。');
console.log('');
console.log('  注意 #matchNode 里那段"参数写进去、失败要删掉"的代码 ——');
console.log('  这正是【回溯】的标准动作（选择 → 递归 → 撤销），详见 13_backtracking_and_greedy.js。');

// ---------------------------------------------------------------------------
// 4. KMP：失败函数是怎么来的
// ---------------------------------------------------------------------------

console.log('\n--- 4. KMP：用"模式串自己的规律"跳过无效比较 ---');
console.log('');
console.log('先看暴力匹配为什么慢。在文本 "aaaaab" 里找模式 "aaab"：');
console.log('');
console.log('    文本:  a a a a a b');
console.log('    模式:  a a a b');
console.log('           ✓ ✓ ✓ ✗        ← 比了 4 次，第 4 个失败');
console.log('');
console.log('  暴力匹配的做法：把模式【右移一格】，从头再比 ——');
console.log('');
console.log('    文本:  a a a a a b');
console.log('    模式:    a a a b      ← 又要重新比 "aaa"，可这三个字符刚才明明已经知道是 a 了！');
console.log('');
console.log('  文本是 "aaaa...a"、模式是 "aaa...ab" 时，暴力匹配每次都要比 m 次才失败，');
console.log('  总共比 n × m 次 —— 这就是最坏情况 O(n × m)。');
console.log('');
console.log('  ★ KMP 的洞察：模式串 "aaab" 自己就含有信息 —— 前缀 "aa" 等于后缀 "aa"。');
console.log('    所以当第 4 个字符 b 失配时，前 3 个字符 "aaa" 已经匹配上了，');
console.log('    而 "aaa" 的后缀 "aa" 等于模式的前缀 "aa"，因此可以直接把模式右移 2 格：');
console.log('');
console.log('    文本:  a a a a a b');
console.log('    模式:      a a a b    ← 前两个 a 不用再比了，直接从第 3 个位置继续');
console.log('');
console.log('    文本的指针【从不回退】—— 这是 KMP 是 O(n + m) 的根本原因。');
console.log('');
console.log('  ★ 失败函数（next 数组 / 前缀函数）的定义：');
console.log('      next[i] = 子串 pattern[0..i] 中，「最长的、相等的真前缀与真后缀」的长度。');
console.log('      （"真" = 不能是子串本身，否则永远等于自己，没有意义）');
console.log('');
console.log('  以 pattern = "aabaaab" 为例，逐个位置算一遍：');
console.log('');
{
  const pattern = 'aabaaab';
  const next = new Array(pattern.length).fill(0);
  console.log('    下标 i'.padEnd(12) + '字符'.padEnd(8) + '子串 pattern[0..i]'.padEnd(24) + '最长相等真前后缀'.padEnd(18) + 'next[i]');
  console.log('    ' + '-'.repeat(78));
  console.log('    ' + '0'.padEnd(12) + pattern[0].padEnd(8) + pattern[0].padEnd(24) + '（无真前后缀）'.padEnd(18) + '0');
  let k = 0;
  for (let i = 1; i < pattern.length; i++) {
    while (k > 0 && pattern[i] !== pattern[k]) k = next[k - 1];
    if (pattern[i] === pattern[k]) k += 1;
    next[i] = k;
    const sub = pattern.slice(0, i + 1);
    const border = k > 0 ? `${sub.slice(0, k)} == ${sub.slice(sub.length - k)}` : '（无）';
    console.log(`    ${String(i).padEnd(12)}${pattern[i].padEnd(8)}${sub.padEnd(24)}${border.padEnd(18)}${k}`);
  }
  console.log('');
  console.log(`    最终 next = [${next.join(', ')}]`);
}

/**
 * 求失败函数（前缀函数）。
 * next[i] = pattern[0..i] 的最长"相等真前缀=真后缀"的长度。
 *
 * 复杂度 O(m)：看起来有两层循环，但内层 while 每次至少让 k 减 1，
 * 而 k 在整个过程中最多增加 m 次，所以总的回退次数不超过 m —— 平摊下来是 O(m)。
 */
function buildNext(pattern) {
  const next = new Array(pattern.length).fill(0);
  let k = 0; // k = 当前已知的最长 border 长度
  for (let i = 1; i < pattern.length; i++) {
    // 失配就沿着 border 链往回退，直到能接上或者退无可退
    while (k > 0 && pattern[i] !== pattern[k]) k = next[k - 1];
    if (pattern[i] === pattern[k]) k += 1;
    next[i] = k;
  }
  return next;
}

console.log('');
console.log('  ★ 为什么这两行代码就算出了答案？分两种情况：');
console.log('    · 如果 pattern[i] 能接在 border 后面（pattern[i] === pattern[k]），');
console.log('      那 border 长度 +1 就是新的最长 border；');
console.log('    · 接不上就【退而求其次】—— 找一个更短的 border 再试。');
console.log('      代码里 k = next[k-1] 就是"退到次长的 border"，因为它保证"次长 border 的前缀"');
console.log('      和"当前后缀"依然相等。整个 while 就是在 border 链上不断往下走。');
console.log('');
console.log('  ★ 现在看 KMP 的匹配主循环 —— 它和 buildNext 几乎是同一段代码：');
console.log('');
console.log('    function kmpSearch(text, pattern) {');
console.log('      const next = buildNext(pattern);');
console.log('      let k = 0;                              // k = 已匹配的字符数');
console.log('      for (let i = 0; i < text.length; i++) { // ★ i 只增不减，文本指针永不回退');
console.log('        while (k > 0 && text[i] !== pattern[k]) k = next[k - 1];  // 失配 → 沿着 border 链跳');
console.log('        if (text[i] === pattern[k]) k += 1;   // 匹配上，往前推一位');
console.log('        if (k === pattern.length) {           // 整段匹配成功');
console.log('          record(i - pattern.length + 1);');
console.log('          k = next[k - 1];                    // 继续找下一次出现（可能有重叠）');
console.log('        }');
console.log('      }');
console.log('    }');
console.log('');
console.log('  ★ 为什么是 O(n + m) 而不是 O(n × m)？');
console.log('    ① 预处理 O(m)：上面已说明，k 的回退总次数不超过它增加的次数。');
console.log('    ② 匹配 O(n)：i 一路走完文本，从不回退（这是与暴力最本质的区别）；');
console.log('       内层 while 每次让 k 变小，而 k 每轮最多 +1，所以 while 的总次数也是 O(n)。');
console.log('       【加法而不是乘法】—— 这就是 O(n + m) 的来源。');

/** KMP 主算法：返回 pattern 在 text 中所有出现位置的下标 */
function kmpSearch(text, pattern) {
  const result = [];
  if (pattern.length === 0) return result;
  const next = buildNext(pattern);
  let k = 0;
  for (let i = 0; i < text.length; i++) {
    while (k > 0 && text[i] !== pattern[k]) k = next[k - 1];
    if (text[i] === pattern[k]) k += 1;
    if (k === pattern.length) {
      result.push(i - pattern.length + 1);
      k = next[k - 1]; // 允许重叠匹配，所以不是重置为 0
    }
  }
  return result;
}

/** 暴力匹配：每次失配就把模式右移一位、从头再来 */
function bruteSearch(text, pattern) {
  const result = [];
  if (pattern.length === 0) return result;
  const n = text.length;
  const m = pattern.length;
  for (let i = 0; i + m <= n; i++) {
    let j = 0;
    while (j < m && text[i + j] === pattern[j]) j += 1;
    if (j === m) result.push(i);
  }
  return result;
}

console.log('');
console.log('  正确性验证（三种文本 × 三个模式，KMP 与暴力结果必须完全一致）：');
{
  const texts = ['aaaaab', 'abababab', 'the quick brown fox jumps over the lazy dog'];
  const patterns = ['aaab', 'abab', 'the'];
  let allOk = true;
  for (const t of texts) {
    for (const p of patterns) {
      const a = kmpSearch(t, p).join(',');
      const b = bruteSearch(t, p).join(',');
      if (a !== b) allOk = false;
      console.log(
        `    text="${t.slice(0, 30)}" pattern="${p}"  →  KMP [${a}]  暴力 [${b}]  ${a === b ? '✓' : '✗'}`,
      );
    }
  }
  console.log(`  全部一致：${allOk ? '是 ✓' : '否 ✗'}`);
}
console.log('');
console.log('  再验证一个容易出错的细节 —— 重叠出现：');
{
  const t = 'aaaaa';
  const p = 'aa';
  console.log(`    text="aaaaa", pattern="aa"  →  出现位置 [${kmpSearch(t, p).join(', ')}]`);
  console.log('    共 4 次（不是 2 次）—— 因为匹配成功后没有把 k 重置为 0，');
  console.log('    而是 k = next[k-1] = 1，允许候选区间重叠。');
  console.log('    如果要"不重叠"的语义，匹配成功后直接 k = 0 即可。');
}

// ---------------------------------------------------------------------------
// 5. 实测：KMP vs 暴力匹配
// ---------------------------------------------------------------------------

console.log('\n--- 5. 实测：KMP 一定更快吗？---');
console.log('');
console.log('设计两组数据，把两种算法的性格彻底暴露出来：');
console.log('');
console.log('  A. 【最坏情况】文本 = "aaaa...a"，模式 = "aaa...ab"');
console.log('     模式前 m-1 个字符全匹配，最后一个必失配 → 暴力每轮都要比 m 次');

const N = 20000;
const M = 40;

const worstText = 'a'.repeat(N);
const worstPattern = 'a'.repeat(M - 1) + 'b';

console.log('');
console.log(`     N = ${N}（全是 a），M = ${M}（${M - 1} 个 a + 1 个 b）`);
console.log('');
{
  const r1 = bruteSearch(worstText, worstPattern);
  const r2 = kmpSearch(worstText, worstPattern);
  console.log(`     暴力匹配结果 ${JSON.stringify(r1)}，KMP 结果 ${JSON.stringify(r2)} —— 都没找到，两者一致 ✓`);
  console.log(`     但暴力匹配共比较了约 ${N * M} 次字符，KMP 只比较了约 ${N + M} 次 —— 相差 ${M} 倍。`);
}

const worstBruteMs = medianMs(() => {
  sink.value = bruteSearch(worstText, worstPattern).length;
});
const worstKmpMs = medianMs(() => {
  sink.value = kmpSearch(worstText, worstPattern).length;
});

console.log('');
console.log('  B. 【随机文本】文本从字母表随机生成，模式也是随机的');
console.log('     每个位置一上来就失配，暴力几乎没有浪费 → 这时 KMP 的优势就没了');

const rnd = makeRandom(123456);
const letters = 'abcdefghijklmnopqrstuvwxyz';
let randomText = '';
for (let i = 0; i < N; i++) randomText += letters[rnd() % 26];
let randomPattern = '';
for (let i = 0; i < M; i++) randomPattern += letters[rnd() % 26];
// 特意把模式的后半段贴进文本，保证至少能找到一次，避免两边都在"找不到"的路径上
randomText = randomText.slice(0, 10000) + randomPattern + randomText.slice(10000);

const randomBruteMs = medianMs(() => {
  sink.value = bruteSearch(randomText, randomPattern).length;
});
const randomKmpMs = medianMs(() => {
  sink.value = kmpSearch(randomText, randomPattern).length;
});

// 正确性交叉验证
const crossCheck =
  bruteSearch(worstText, worstPattern).join(',') === kmpSearch(worstText, worstPattern).join(',') &&
  bruteSearch(randomText, randomPattern).join(',') === kmpSearch(randomText, randomPattern).join(',');

console.log('');
console.log('  实测结果（取中位数）：');
console.log('');
console.log('  场景'.padEnd(38) + '暴力(ms)'.padEnd(14) + 'KMP(ms)'.padEnd(14) + '谁更快');
console.log('  ' + '-'.repeat(86));
{
  const row = (label, a, b) => {
    const winner = a <= b ? `暴力 ${(b / a).toFixed(2)}x` : `KMP ${(a / b).toFixed(2)}x`;
    console.log(label.padEnd(36) + a.toFixed(4).padEnd(14) + b.toFixed(4).padEnd(14) + winner);
  };
  row(`最坏情况（文本全 a，模式 a…ab）`, worstBruteMs, worstKmpMs);
  row(`随机文本 + 随机模式`, randomBruteMs, randomKmpMs);
}
console.log('');
console.log(`  正确性交叉验证（两种算法结果一致）：${crossCheck ? '通过 ✓' : '失败 ✗'}`);
console.log('');
console.log('  ★ 这张表得出了两个都值得记住的结论：');
console.log('');
console.log('  ① 最坏情况下 KMP 完胜 —— 因为暴力匹配退化成了 O(n × m)。');
console.log('     这类"高度重复"的文本在真实世界里并不罕见：');
console.log('     DNA 序列（只有 4 个字母）、日志（大量相似的日期/路径前缀）、');
console.log('     base64 数据、二进制扫描……都是暴力的噩梦。');
console.log('');
console.log('  ② 但随机文本上，暴力匹配【并不慢】，甚至常常反超 KMP。');
console.log('     原因很实在：随机文本里第一个字符就失配的概率是 25/26 ≈ 96%，');
console.log('     暴力的内层循环平均只跑 1 次多一点点，几乎没有浪费；');
console.log('     而 KMP 每次循环都要读 next 数组、做额外的比较和分支判断 ——');
console.log('     这些"固定开销"在没有浪费可省的时候，纯属净亏损。');
console.log('     这也是为什么真实编辑器往往用 Boyer-Moore（从右往左比，能一次跳很远）');
console.log('     而不是 KMP：BM 在自然文本上平均是【亚线性】的，比 KMP 更快。');
console.log('');
console.log('  ③ 所以"KMP 比暴力快"这个说法要加限定条件：');
console.log('     KMP 保证的是【最坏情况的上界】，而不是"平均更快"。');
console.log('     复杂度分析看的是最坏情况，工程选型看的是数据分布 —— 两者都要看。');

// ---------------------------------------------------------------------------
// 6. 滚动哈希：Rabin-Karp
// ---------------------------------------------------------------------------

console.log('\n--- 6. 滚动哈希（Rabin-Karp）：把字符串比较变成数字比较 ---');
console.log('');
console.log('核心想法：把一个字符串当作 BASE 进制的整数，得到一个"指纹"（哈希值）。');
console.log('');
console.log('  比如把 "cat" 看作 BASE=256 的数：');
console.log("    'c' = 99, 'a' = 97, 't' = 116");
console.log('    99 × 256² + 97 × 256¹ + 116 × 256⁰ = 6487156 + 24832 + 116 = 6512104');
console.log('    这个数（对某个大质数取模后）就是 "cat" 的哈希。');
console.log('');
console.log('  ★ "滚动"从哪来？看相邻窗口的关系：');
console.log('');
console.log('    文本 "catalog"，窗口长度 3：');
console.log('      窗口 1:  c a t            哈希 h1');
console.log('      窗口 2:    a t a          哈希 h2 = (h1 - c × 256²) × 256 + a');
console.log('                                   ↑ 去掉最左边的字符，整体左移一位，加上新字符');
console.log('');
console.log('  这一"去旧头、加新尾"的操作是 O(1) 的！');
console.log('  于是"滑动窗口逐位比较"从每步 O(m) 降到了每步 O(1)（期望）。');
console.log('');
console.log('  ★ 哈希冲突怎么办？两个不同的字符串可能有相同的哈希（取模导致的信息丢失）。');
console.log('    标准做法是【双保险】：哈希相等时，再逐字符确认一次（成本极低，因为这种情况很少）。');
console.log('    这叫"哈希过滤 + 精确验证"，是字符串算法的通用套路。');

const HASH_BASE = 256;
const HASH_MOD = 1_000_000_007; // 10⁹+7 是常用的大质数

/**
 * Rabin-Karp：用滚动哈希找 pattern 在 text 中的所有出现位置。
 *
 * 时间复杂度：期望 O(n + m)，最坏 O(n × m)（所有窗口哈希都撞上，每次都要逐字符确认）。
 * 空间复杂度：O(1)（不算结果数组）。
 *
 * 它相对 KMP 的真正优势在于【多模式】场景：
 * 把 k 个等长模式的哈希放进 Set，扫一遍文本就能同时找 k 个模式（每组文本片段只算一次哈希）。
 * KMP 要做 k 次，各扫一遍文本。
 */
function rabinKarp(text, pattern) {
  const result = [];
  const n = text.length;
  const m = pattern.length;
  if (m === 0 || m > n) return result;

  // BASE^(m-1) mod MOD —— 用来"减掉最左边字符"的权重
  let highPower = 1;
  for (let i = 0; i < m - 1; i++) highPower = (highPower * HASH_BASE) % HASH_MOD;

  // 先算出模式串和第一个窗口的哈希
  let patternHash = 0;
  let windowHash = 0;
  for (let i = 0; i < m; i++) {
    patternHash = (patternHash * HASH_BASE + pattern.charCodeAt(i)) % HASH_MOD;
    windowHash = (windowHash * HASH_BASE + text.charCodeAt(i)) % HASH_MOD;
  }

  for (let i = 0; i + m <= n; i++) {
    if (windowHash === patternHash) {
      // 哈希相等还不够，必须逐字符确认（防冲突），这就是"双保险"
      let j = 0;
      while (j < m && text[i + j] === pattern[j]) j += 1;
      if (j === m) result.push(i);
    }
    // 滚动到下一个窗口：去掉最左边的字符，整体左移，加上右边的新字符
    if (i + m < n) {
      const outChar = text.charCodeAt(i);
      windowHash = (windowHash - ((outChar * highPower) % HASH_MOD) + HASH_MOD) % HASH_MOD;
      windowHash = (windowHash * HASH_BASE + text.charCodeAt(i + m)) % HASH_MOD;
    }
  }
  return result;
}

console.log('');
console.log('  Rabin-Karp 的实现要点逐个对照上面的解释：');
console.log('');
console.log('    · highPower = BASE^(m-1)：把最左边字符"移出去"时要减掉的权重；');
console.log('    · 减法后 +HASH_MOD 再取模：因为 JS 的 % 对负数返回负数，必须补一手；');
console.log('    · 哈希相等后仍然逐字符确认：这一段让最坏情况退化到 O(n × m)，');
console.log('      但概率极低（要所有窗口都撞哈希），平均仍是 O(n + m)。');
console.log('');
console.log('  正确性验证（与暴力匹配逐一对照）：');
{
  const cases = [
    ['aaaaa', 'aa'],
    ['abcabcabc', 'abc'],
    ['the quick brown fox', 'own'],
    ['mississippi', 'issi'],
    ['no match here', 'zzz'],
  ];
  let ok = true;
  for (const [t, p] of cases) {
    const rk = rabinKarp(t, p).join(',');
    const br = bruteSearch(t, p).join(',');
    if (rk !== br) ok = false;
    console.log(`    text="${t}" pattern="${p}"  →  RK [${rk}]  暴力 [${br}]  ${rk === br ? '✓' : '✗'}`);
  }
  console.log(`  全部一致：${ok ? '是 ✓' : '否 ✗'}`);
}
console.log('');
console.log('  实测：三种算法在同一份随机文本上的耗时（N = 20000，M = 40）：');
{
  // 为了让三种算法都在"有匹配"的路径上，在文本中间嵌入一个模式
  const rkPattern = randomText.slice(10000, 10040);
  const rkMs = medianMs(() => {
    sink.value = rabinKarp(randomText, rkPattern).length;
  });
  const kmpMs2 = medianMs(() => {
    sink.value = kmpSearch(randomText, rkPattern).length;
  });
  const bruteMs2 = medianMs(() => {
    sink.value = bruteSearch(randomText, rkPattern).length;
  });
  console.log('');
  console.log('    算法'.padEnd(24) + '耗时(ms)'.padEnd(14) + '平均复杂度'.padEnd(18) + '最坏复杂度');
  console.log('    ' + '-'.repeat(76));
  console.log('    暴力匹配'.padEnd(22) + bruteMs2.toFixed(4).padEnd(14) + 'O(n) 常数极小的特例'.padEnd(18) + 'O(n × m)');
  console.log('    KMP'.padEnd(22) + kmpMs2.toFixed(4).padEnd(14) + 'O(n + m)'.padEnd(18) + 'O(n + m)');
  console.log('    Rabin-Karp'.padEnd(22) + rkMs.toFixed(4).padEnd(14) + 'O(n + m) 期望'.padEnd(18) + 'O(n × m) 极小概率');
  console.log('');
  console.log('  ★ 三者结果一致，但适用场景不同：');
  console.log('    · 要【最坏情况有保证】→ KMP；');
  console.log('    · 要【一次找多个模式】→ Rabin-Karp（哈希集合，一次扫描搞定）；');
  console.log('    · 要【找最长公共子串 / 判断重复内容】→ 滚动哈希，');
  console.log('      因为"两个窗口是否相等"被降级成了 O(1) 的数字比较；');
  console.log('    · 自然语言文本上的实际速度 → Boyer-Moore 通常最快（本示例未涉及）。');
}
console.log('');
console.log('  ★ 关于"取模"的一个工程提醒：');
console.log('    这里用 MOD = 10⁹+7，哈希值是 32 位级别的整数，冲突概率约 1/10⁹ ——');
console.log('    单次比较足够安全，但若是"海量字符串去重"，应该用双哈希');
console.log('    （两组 (BASE, MOD) 组合），或者干脆用不受取模影响的字符串比较 ——');
console.log('    因为按【生日悖论】，√MOD ≈ 31623 个哈希值就有约 50% 的碰撞概率。');

// ---------------------------------------------------------------------------
// 7. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 7. 三种字符串算法的复杂度对照 ---');
console.log('');

console.log('算法 / 结构'.padEnd(26) + '预处理'.padEnd(16) + '单次查询/匹配'.padEnd(20) + '空间');
console.log('-'.repeat(90));
for (const [algo, pre, query, space] of [
  ['Trie 建树', 'O(总字符数)', '—', 'O(总节点数) 最坏 = 总字符数'],
  ['Trie 查找 / 插入', '—', 'O(m) 与词数无关 ★', '—'],
  ['Trie 前缀枚举', '—', 'O(m + 结果数 × m)', '—'],
  ['KMP', 'O(m) 求 next', 'O(n + m) 最坏也有保证 ★', 'O(m) 存 next'],
  ['Rabin-Karp', 'O(m) 算初始哈希', 'O(n + m) 期望', 'O(1)'],
  ['暴力匹配', '无', 'O(n) 平均，O(n × m) 最坏', 'O(1)'],
  ['哈希表（对照）', 'O(总字符数)', 'O(m) 只能查完整串，查前缀退化 O(词数 × m)', 'O(总字符数)'],
]) {
  console.log(algo.padEnd(24) + pre.padEnd(18) + query.padEnd(30) + space);
}

console.log('');
console.log('遇到字符串问题该怎么选？');
console.log('');
console.log('  问题'.padEnd(40) + '该用什么');
console.log('  ' + '-'.repeat(80));
for (const [problem, answer] of [
  ['一堆词里反复查前缀 / 自动补全', 'Trie ★'],
  ['敏感词、关键词过滤（多模式）', 'Trie 或 AC 自动机（Trie + KMP 思想）'],
  ['一段文本里找一个模式', '朴素够用就用朴素；最坏情况要求保证用 KMP'],
  ['一次找多个等长模式', 'Rabin-Karp（哈希集合一次扫描）'],
  ['判断两个长串是否相等 / 找重复片段', '滚动哈希 ★'],
  ['URL 路由 / 域名匹配', 'Trie（按路径段或按域名倒序分层）'],
  ['求最长公共子串', 'DP（见 17）或 后缀数组 / 滚动哈希 + 二分'],
  ['拼写纠错（编辑距离 ≤ k）', 'DP（见 10）或 BK 树'],
]) {
  console.log('  ' + problem.padEnd(40) + answer);
}

console.log('');
console.log('一句话总结：');
console.log('  · Trie 把"前缀相同"变成了"路径相同"，用空间换来了 O(词长) 的查询；');
console.log('  · KMP 把"模式串自身的重复结构"变成了跳跃的依据，让文本指针永不回退；');
console.log('  · 滚动哈希把"字符串比较"降级成了"数字比较"，O(m) 变 O(1)；');
console.log('  · 三者共同的思想是【预计算】：把能提前算的信息算好，别在循环里重复劳动 ——');
console.log('    这和 DP 的"把重复计算换成查表"是同一个思想的不同侧面。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
