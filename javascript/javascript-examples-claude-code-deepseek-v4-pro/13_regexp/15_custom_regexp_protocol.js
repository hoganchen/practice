/**
 * ============================================================================
 * 知识点：自定义正则协议 —— Symbol.match / replace / search / split（含 matchAll）
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】高级
 * 【前置知识】13_regexp/11_string_methods_with_regex.js、13_regexp/10_replace_with_function.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字符串上的四个方法看起来是"只接受正则"的，其实它们接受的是一组协议：
 *      String.prototype.match(searchValue)    → 调用 searchValue[Symbol.match](str)
 *      String.prototype.replace(sv, repl)     → 调用 sv[Symbol.replace](str, repl)
 *      String.prototype.search(sv)            → 调用 sv[Symbol.search](str)
 *      String.prototype.split(sep, limit)     → 调用 sep[Symbol.split](str, limit)
 *      String.prototype.matchAll(sv)          → 调用 sv[Symbol.matchAll](str)   ← 第五个
 *    只要你的对象上挂了这个名字的方法（方法名就是那四个 well-known symbol），
 *    它就能像正则一样被字符串方法直接使用 —— 哪怕它根本不是 RegExp 的实例。
 *
 * 2. 为什么需要
 *    · 写 DSL / 模板引擎：{{name}} 这类占位符不是正则能优雅表达的，
 *      但你的"模板对象"可以带着 Symbol.replace 直接喂给 str.replace()。
 *    · 惰性模式对象：模式串可能要读配置、查缓存、甚至发请求才能确定，
 *      用对象包一层，把真正的 RegExp 推迟到第一次使用才构造（lazy）。
 *    · 可替换的实现：想换成 WASM 正则、RE2、或"先查缓存、未命中再走正则"的策略时，
 *      只要保证实现了同样的协议，调用方代码一行都不用改（典型的依赖倒置）。
 *    · 解释"为什么 str.replace 能同时接受字符串和正则"：因为分派发生在
 *      方法查找阶段，而不是靠 instanceof 判断。
 *
 * 3. 核心语法要点
 *    - 方法名用计算属性写法：[Symbol.match](str) { ... }。
 *    - 调用约定（务必记牢，签名与正则原生的完全一致）：
 *        [Symbol.match](string)            → 返回类数组（通常是一个数组），或 null
 *        [Symbol.replace](string, replaceValue) → 返回一个字符串
 *        [Symbol.search](string)           → 返回匹配位置的下标（找不到返回 -1）
 *        [Symbol.split](string, limit)     → 返回一个数组（**limit 要自己处理**）
 *        [Symbol.matchAll](string)         → 返回一个迭代器
 *    - this 就是你的对象本身，所以方法里可以安全地读 this.xxx 配置。
 *    - 顺序很重要：字符串方法**先看 symbol，再看是不是字符串**。
 *      也就是说，一个普通对象如果没挂 Symbol.xxx，str.replace(obj) 会把它
 *      当成普通字符串（To<String>）来处理，而不是报错。
 *    - RegExp.prototype 上原生就有这五个 symbol 方法，
 *      所以"正则能用"和"你的对象能用"走的是同一条代码路径。
 *    - 想直接复用原生实现，可以 `RegExp.prototype[Symbol.replace].call(re, str, repl)`。
 *
 * 4. 常见陷阱
 *    - Symbol.split 收到 limit 但框架**不会**帮你截断，必须自己 return 前 N 项。
 *    - 这四个 symbol 必须是函数；挂一个非函数（如数字）会抛 TypeError。
 *    - 别把"方法名"写错成普通字符串：obj['Symbol.match'] 是无效的，必须是那个 symbol。
 *    - 反过来的坑：内置的 isRegExp 检查（IsRegExp）只认 Symbol.match 是否为真值。
 *      所以 /a/.startsWith 会抛 TypeError（"不能对正则用 startsWith"），
 *      给正则设 re[Symbol.match] = false 就能绕过 —— 这是老代码里的经典技巧。
 *    - 自定义对象不会被 replaceAll 的"必须有 g 标志"检查拦住（它不是 RegExp），
 *      但你还是得自己实现"替换全部"的语义。
 *    - 返回类型不对时，报错点会很远：比如 Symbol.search 返回了字符串，
 *      调用方拿到 '3' 而不是 3，后续算术会静默出错。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/15_custom_regexp_protocol.js
 *
 * 【预期输出】
 *   逐个演示四个（加 matchAll 共五个）symbol 的完整可运行例子，
 *   再剖析字符串方法的分派顺序、原生默认行为与真实场景（模板引擎 / 惰性模式对象）。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 协议总览：五个 well-known symbol
// ---------------------------------------------------------------------------

console.log('--- 0. 协议总览 ---');

// 这几个 symbol 是全局注册的，任何环境里拿到都是同一个值
console.log('well-known symbol 一览：');
for (const name of ['match', 'matchAll', 'replace', 'search', 'split']) {
  const sym = Symbol[name];
  console.log(`  Symbol.${name.padEnd(9)} → ${String(sym)}`);
}

// 关键事实：RegExp.prototype 上原生就挂满了这五个方法
console.log('\nRegExp.prototype 上的原生协议方法：');
for (const sym of Object.getOwnPropertySymbols(RegExp.prototype)) {
  const desc = Object.getOwnPropertyDescriptor(RegExp.prototype, sym);
  console.log(`  ${String(sym).padEnd(28)} typeof = ${typeof desc.value}`);
}
console.log('  ↑ 字符串方法不认识"正则"，它只认这五个方法名；');
console.log('    因为普通正则身上有这五个方法，所以它"看起来"是被特殊支持的。');

// 反向验证：字符串上并没有这些方法，所以 str.replace('b', ...) 走的是另一条路径
console.log('\nString.prototype 上有 Symbol.replace 吗：', typeof String.prototype[Symbol.replace]);
console.log("  → 没有。所以 'abc'.replace('b', 'X') 里的 'b' 会被当作普通字符串处理。");
console.log("    实测：'abc'.replace('b', 'X') =", 'abc'.replace('b', 'X'));

// ---------------------------------------------------------------------------
// 1. Symbol.match：让自定义对象能被 str.match() 接受
// ---------------------------------------------------------------------------

console.log('\n--- 1. Symbol.match ---');

/**
 * 一个最小的"伪正则"对象：只实现 Symbol.match。
 * 它的行为是"找出字符串中所有的大写字母"，返回一个数组。
 * 注意：它完全不是 RegExp 的实例，也不继承 RegExp.prototype。
 */
const upperCaseFinder = {
  /**
   * @param {string} string 被搜索的字符串
   * @returns {Array|null} 与 RegExp.prototype[Symbol.match] 的约定一致：
   *                       命中返回类数组，未命中返回 null
   */
  [Symbol.match](string) {
    // this 指向对象本身，可以安全地读取对象上的配置
    const found = [];
    for (let i = 0; i < string.length; i++) {
      // 逐个字符判断是否为大写字母（比较大写形式，且本身不是小写形式）
      const ch = string[i];
      if (ch >= 'A' && ch <= 'Z') found.push(ch);
    }
    // 一个都没有时返回 null，这样调用方的 `?? []` 兜底才有意义
    return found.length > 0 ? found : null;
  },
};

console.log('对象是不是 RegExp 实例：', upperCaseFinder instanceof RegExp);
console.log('对象是否等于字符串 "a"：', 'abc'.match(upperCaseFinder));
console.log("'Hello World 2024'.match(upperCaseFinder) =", JSON.stringify('Hello World 2024'.match(upperCaseFinder)));
console.log("'abc123'.match(upperCaseFinder) =", 'abc123'.match(upperCaseFinder), '← 返回 null，与正则语义一致');

// 证明分派确实发生在 Symbol.match 上：
// 只要把这个方法删掉，同一个对象立刻会退化成"普通字符串"处理
const withoutSymbol = { ...upperCaseFinder };
delete withoutSymbol[Symbol.match];
console.log('\n删掉 Symbol.match 之后：');
console.log("  'abc'.match(withoutSymbol) =", JSON.stringify('abc'.match(withoutSymbol)));
console.log('  ↑ 注意它**没有报错**，而是退化了：没有 Symbol.match 时，');
console.log('    str.match 会执行 new RegExp(对象)，而对象被 ToString 成 "[object Object]"，');
console.log('    这个字符串作为正则源被解析成一个字符类 [objectO ]（含 o b j e c t 和空格），');
console.log("    正好匹配到 'abc' 里的 'b' —— 结果完全是巧合，语义已经跑偏了。");
console.log('    这说明分派完全依赖 Symbol.match 是否可调用，写错名字不会报错只会静默出错。');

// 让返回结构模拟真实的 match 结果（带 index / input / groups）
console.log('\n模拟真实 match 返回结构的数组：');
const pseudoMatchResult = {
  [Symbol.match](string) {
    const idx = string.indexOf('needle');
    if (idx === -1) return null;
    // 手工拼一个"类 match 结果"的数组：额外挂上 index / input / groups
    const result = ['needle'];
    result.index = idx;
    result.input = string;
    result.groups = undefined;
    return result;
  },
};
const m = 'hay needle stack'.match(pseudoMatchResult);
console.log('  返回值：', JSON.stringify(m), '| index =', m.index, '| input =', JSON.stringify(m.input));

// ---------------------------------------------------------------------------
// 2. Symbol.replace：最实用的一个
// ---------------------------------------------------------------------------

console.log('\n--- 2. Symbol.replace ---');

/**
 * 一个"把若干关键词高亮"的伪正则对象。
 * 它比正则更方便的地方在于：关键词列表可以动态传入，不需要拼接正则、不需要转义。
 */
function createKeywordHighlighter(keywords, tag = 'mark') {
  return {
    // 暴露出来仅用于演示，字符串方法并不会读它
    keywords,
    /**
     * @param {string} string 原字符串
     * @param {string|Function} replaceValue 替换内容（模板串或函数）
     * @returns {string} 新字符串
     */
    [Symbol.replace](string, replaceValue) {
      // 逐个关键词做全局替换。
      // 因为关键词是普通字符串，所以这里的 replace 走"字符串查找"路径，
      // 天然避免了正则元字符注入的问题（无需自己写 escapeRegExp）。
      let out = string;
      for (const kw of this.keywords) {
        // 用 split/join 实现"替换全部"，避免写正则
        out = out.split(kw).join(
          // replaceValue 是函数时按正则的约定调用：fn(match, offset, wholeString)
          typeof replaceValue === 'function' ? replaceValue(kw, out.indexOf(kw), string) : replaceValue,
        );
      }
      return out;
    },
  };
}

const highlighter = createKeywordHighlighter(['JS', '正则']);
console.log('对象是 RegExp 实例吗：', highlighter instanceof RegExp);
console.log("'我学 JS，也学正则。' →", '我学 JS，也学正则。'.replace(highlighter, '[$&]'));
// 注意：$& 只在"正则的默认替换模板"里才有特殊含义，
// 我们的自定义实现把替换串原样使用，所以上面输出里的 $& 就是字面量。
console.log("  ↑ 注意 $& 没有被展开：\\$& 是 RegExp.prototype[Symbol.replace] 的特性，");
console.log('    自定义实现要自己决定支不支持替换模板（下一节会对比原生行为）。');

// 传函数作为替换内容
const replaced = '我学 JS，也学正则。'.replace(highlighter, (match, offset) => `<${match}#${offset}>`);
console.log('\n传函数：', replaced);

// 传对象（会被 ToString）
console.log('传对象：', '我学 JS。'.replace(highlighter, { toString: () => '★' }));

// 送一个"完整可运行"的模板引擎例子：{{key}} 渲染
console.log('\n【完整例子】用 Symbol.replace 实现模板渲染');
/**
 * 一个极简模板引擎：把 {{key}} 替换成数据里的值。
 * 为什么用 Symbol.replace 而不是直接写一个 render 函数？
 *   · 调用方可以沿用熟悉的 str.replace(template, data) 心智模型；
 *   · 替换内容由调用方决定（传函数就能做 HTML 转义、缺失值高亮等）。
 */
function createTemplate(template) {
  return {
    template,
    [Symbol.replace](string, replaceValue) {
      // 用正则找出所有 {{...}}，但把"取哪个 key"的决策交给 replaceValue
      return string.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (whole, key, offset) => {
        // 把决定权交给调用方：是字符串就直接用，是函数就调用它
        return typeof replaceValue === 'function'
          ? replaceValue(key, whole, offset)
          : whole;
      });
    },
  };
}

const tpl = createTemplate('{{name}}');
const templateText = '你好 {{name}}，你的余额是 {{balance}} 元。';
// 用法一：传一个"查表函数"，自己决定缺失值怎么办
console.log(
  templateText.replace(tpl, (key) => ({ name: '张三', balance: '1,299.50' })[key] ?? `«${key} 缺失»`),
);
// 用法二：传函数同时做 HTML 转义
console.log(
  templateText.replace(tpl, (key) => {
    const value = { name: '<b>张三</b>', balance: '10' }[key] ?? '';
    return String(value).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  }),
);
console.log('  ↑ 全程没有 new RegExp(用户输入)，天然免疫正则注入。');

// ---------------------------------------------------------------------------
// 3. Symbol.search：让自定义对象能被 str.search() 接受
// ---------------------------------------------------------------------------

console.log('\n--- 3. Symbol.search ---');

/**
 * 一个"不区分重音与大小写"的搜索对象。
 * 场景：用户搜索 "cafe" 应该也能命中 "café"，这用普通正则很麻烦。
 */
const diacriticInsensitive = {
  /** 把带重音的字符归一化掉，用于比较 */
  normalize(text) {
    // NFD 把 é 拆成 e + 组合重音符，再用正则删掉组合记号
    return text.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
  },
  /**
   * @param {string} string 被搜索的字符串
   * @returns {number} 匹配起始下标；找不到返回 -1（与正则约定一致）
   */
  [Symbol.search](string) {
    // 注意：这里的 replace 会用到一个真正的正则，不影响协议本身
    const needle = this.normalize(this.needle ?? '');
    return this.normalize(string).indexOf(needle);
  },
  needle: '',
};

/** 便利构造：设置要搜索的词 */
function searchFor(needle) {
  return { ...diacriticInsensitive, needle };
}

console.log("'I love café'.search(searchFor('cafe')) =", 'I love café'.search(searchFor('cafe')));
console.log("'I love CAFÉ'.search(searchFor('café')) =", 'I love CAFÉ'.search(searchFor('café')));
console.log("'nothing here'.search(searchFor('cafe')) =", 'nothing here'.search(searchFor('cafe')), '← 找不到返回 -1');
console.log("'I love café'.search('cafe') =", 'I love café'.search('cafe'), '← 对比：传普通字符串只能精确匹配');

// 用 indexOf 与 search 一起定位
const haystack = '前缀 café 后缀';
const found = haystack.search(searchFor('cafe'));
console.log('\n结合下标做二次处理：');
console.log('  原串：', haystack);
console.log('  search 结果：', found);
console.log('  用下标切片取出后半段：', JSON.stringify(haystack.slice(found)));
console.log('  ↑ 这让自定义搜索对象能和"按返回下标继续处理"的既有代码无缝配合。');

// ---------------------------------------------------------------------------
// 4. Symbol.split：注意 limit 必须自己处理
// ---------------------------------------------------------------------------

console.log('\n--- 4. Symbol.split ---');

/**
 * 一个按"跑动长度"切分的对象：每 N 个字符切一刀。
 * 场景：银行卡号 / 身份证 / 序列号的展示分组。
 * 注意它与正则的本质不同 —— 正则的 split 是"用分隔符切开"，
 * 这里是"按固定长度切"，语义更接近 chunk 而不是 split，
 * 但通过协议它同样能挂到 str.split() 上。
 */
function everyNChars(n) {
  return {
    n,
    /**
     * @param {string} string 原字符串
     * @param {number|undefined} limit 结果最多保留几段，**必须自己截断**
     * @returns {string[]}
     */
    [Symbol.split](string, limit) {
      const parts = [];
      for (let i = 0; i < string.length; i += this.n) {
        parts.push(string.slice(i, i + this.n));
      }
      // 【关键】框架把 limit 原样传给你，但不会替你截断结果。
      // 这和正则的行为一致（RegExp.prototype[Symbol.split] 内部自己处理 limit）。
      if (limit === undefined) return parts;
      return parts.slice(0, Math.max(0, limit));
    },
  };
}

const cardNumber = '6222021234567890123';
console.log('每 4 位切一刀，不传 limit：');
console.log('  ', JSON.stringify(cardNumber.split(everyNChars(4))));
console.log('每 4 位切一刀，limit = 2：');
console.log('  ', JSON.stringify(cardNumber.split(everyNChars(4), 2)));
console.log('limit = 0：');
console.log('  ', JSON.stringify(cardNumber.split(everyNChars(4), 0)), '← 我们自己把它截成了 0 段');

// 反例：如果忘了处理 limit 会怎样
const forgotLimit = {
  [Symbol.split](string) {
    // 完全忽略第二个参数
    return string.split('');
  },
};
console.log('\n反例：忘记处理 limit 的自定义 split');
console.log("  'abc'.split(对象, 2) =", JSON.stringify('abc'.split(forgotLimit, 2)));
console.log('  ↑ limit=2 被无视了，返回了 3 段。框架不会帮你兜底，这是最常见的实现疏漏。');

// 对照：正则的 split 是自己处理 limit 的
console.log('\n对照正则：');
console.log("  'a,b,c'.split(/,/, 2) =", JSON.stringify('a,b,c'.split(/,/, 2)));
console.log('  看 RegExp.prototype[Symbol.split] 的源码可知，limit 是它内部 read 并 截断 的。');
console.log('  原生实现：', JSON.stringify(RegExp.prototype[Symbol.split].call(/,/, 'a,b,c', 2)));

// ---------------------------------------------------------------------------
// 5. Symbol.matchAll：第五个协议
// ---------------------------------------------------------------------------

console.log('\n--- 5. Symbol.matchAll ---');

/**
 * 一个"流式"的匹配对象：只实现 Symbol.matchAll，返回一个迭代器。
 * 场景：大文本里找匹配时不想一次性把全部结果算出来（惰性求值）。
 */
const lazyNumbers = {
  /**
   * @param {string} string
   * @returns {Iterator} 迭代器，每次 next() 产出一个 match 类数组
   */
  [Symbol.matchAll](string) {
    // 用生成器函数天然得到一个迭代器，并且是惰性求值的
    return (function* generate() {
      // 用正则逐段找出数字
      const re = /\d+/g;
      let m;
      while ((m = re.exec(string)) !== null) {
        // 手工构造带 index / input 的"类 match 数组"，与原生结构保持一致
        const item = [m[0]];
        item.index = m.index;
        item.input = string;
        // yield 出去，调用方每次取值才会继续算
        yield item;
      }
    })();
  },
};

console.log("'a1 b22 c333'.matchAll(lazyNumbers) 展开：");
for (const match of 'a1 b22 c333'.matchAll(lazyNumbers)) {
  console.log(`   值=${match[0].padEnd(4)} index=${match.index}`);
}
console.log('  ↑ matchAll 要求返回一个"迭代器"，生成器函数正好满足。');
console.log('    注意：matchAll 不会像正则那样强制检查 g 标志 —— 它只认 Symbol.matchAll。');

// ---------------------------------------------------------------------------
// 6. 分派逻辑剖析：字符串方法内部到底怎么找这些 symbol
// ---------------------------------------------------------------------------

console.log('\n--- 6. 分派逻辑剖析 ---');

/**
 * 一个"会说话"的对象：把每次被调用时收到的参数原样打印出来，
 * 用来观察字符串方法到底传了什么。
 */
function createSpy(label) {
  const log = (name, argsLike) => {
    // arguments 是"类数组"而不是真数组，必须先转成数组才能用 map
    const shown = Array.from(argsLike).map((a) => {
      if (typeof a === 'function') return '[Function]';
      // JSON.stringify(undefined) 返回 undefined（没有引号），这里显式写成字符串
      return a === undefined ? 'undefined' : JSON.stringify(a);
    });
    console.log(`    ${label}.${name} 收到参数：(${shown.join(', ')})`);
  };
  return {
    [Symbol.match](string) {
      log('Symbol.match', arguments);
      return ['spy'];
    },
    [Symbol.replace](string, replaceValue) {
      log('Symbol.replace', arguments);
      return '<返回值由我决定>';
    },
    [Symbol.search](string) {
      log('Symbol.search', arguments);
      return 0;
    },
    [Symbol.split](string, limit) {
      log('Symbol.split', arguments);
      return ['spy'];
    },
  };
}

console.log('观察每个字符串方法向协议方法传了什么参数：');
console.log("  'abc'.match(spy)：");
'abc'.match(createSpy('  match'));
console.log("  'abc'.replace(spy, 'X')（替换内容是字符串）：");
'abc'.replace(createSpy('  replace'), 'X');
console.log("  'abc'.replace(spy, fn)（替换内容是函数）：");
'abc'.replace(createSpy('  replace'), () => 'X');
console.log("  'abc'.search(spy)：");
'abc'.search(createSpy('  search'));
console.log("  'a,b'.split(spy)：");
'a,b'.split(createSpy('  split'));
console.log("  'a,b'.split(spy, 1)：");
'a,b'.split(createSpy('  split'), 1);
console.log('  ↑ 可以看到：replace 的第二个参数是原样透传的，字符串方法自己不解释它；');
console.log('    split 的 limit 同样是透传，由协议方法自己决定怎么用。');

// 用规范伪代码还原分派顺序
console.log('\n用规范伪代码还原 String.prototype.replace 的分派顺序：');
console.log('  1. 若 searchValue 既不是 undefined 也不是 null：');
console.log('       let replacer = GetMethod(searchValue, @@replace)   // 读属性');
console.log('       若 replacer 不是 undefined → return replacer.call(searchValue, str, replaceValue)');
console.log('  2. 否则（没有 @@replace）→ 走"字符串查找"路径：');
console.log('       searchString = ToString(searchValue)');
console.log('       在 str 里查找 searchString，做字符串替换');
console.log('  关键点：第 1 步用的是 GetMethod，它会做"属性存在性检查 + 可调用性检查"。');

// 验证第 2 步的"降级为字符串"行为
console.log('\n验证：没有 Symbol.replace 时会退化成字符串处理');
const plainObject = { toString: () => 'b' }; // 一个会被转成 'b' 的普通对象
console.log("  'abc'.replace(plainObject, 'X') =", 'abc'.replace(plainObject, 'X'));
console.log('  ↑ 返回 "aXc"：对象被 ToString 成了 "b"，然后按字符串替换。');
console.log('    这说明"没有协议方法"不会报错，而是静默切换语义 —— 因此实现协议时');
console.log('    方法名写错、或忘了挂到对象上，都会变成很难发现的 bug。');

// 验证 GetMethod 的"可调用性检查"
console.log('\n验证：Symbol.replace 不是函数时会抛 TypeError');
try {
  'abc'.replace({ [Symbol.replace]: 42 }, 'X');
  console.log('  没有报错（不该发生）');
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}

// ---------------------------------------------------------------------------
// 7. 原生默认行为：RegExp.prototype[Symbol.replace]
// ---------------------------------------------------------------------------

console.log('\n--- 7. RegExp.prototype[Symbol.replace] 的默认行为 ---');

// 既然正则也是通过同一个协议工作的，那就可以直接把原生实现"借"出来用
console.log('可以直接调用原生实现：');
console.log(
  "  RegExp.prototype[Symbol.replace].call(/b/, 'abc', 'X') =",
  RegExp.prototype[Symbol.replace].call(/b/, 'abc', 'X'),
);
console.log('  ↑ 这正是 "abc".replace(/b/, "X") 底层实际执行的那行代码。');

// 原生实现支持的"替换模板"（这是它比自定义实现强的地方之一）
console.log('\n原生实现的替换模板（$ 系列）—— 自定义实现需要自己支持：');
const templateCases = [
  ['$$', '插入一个字面量 $'],
  ['$&', '插入整个匹配的子串'],
  ['$`', '插入匹配之前的文本（匹配左侧）'],
  ["$'", '插入匹配之后的文本（匹配右侧）'],
  ['$1 / $2', '插入第 N 个捕获组'],
  ['$<name>', '插入具名捕获组'],
];
for (const [token, desc] of templateCases) {
  console.log(`  ${token.padEnd(10)} ${desc}`);
}
console.log("  实测：'abcdef'.replace(/cd/, '[$&]') =", 'abcdef'.replace(/cd/, '[$&]'));
console.log("  实测：'abcdef'.replace(/cd/, \"[$`][$']\") =", 'abcdef'.replace(/cd/, "[$`][$']"));
console.log("  实测：'2024-05-06'.replace(/(\\d+)-(\\d+)/, '$2/$1') =", '2024-05-06'.replace(/(\d+)-(\d+)/, '$2/$1'));
console.log("  实测：'a1'.replace(/(?<letter>\\w)(?<num>\\d)/, '$<num>$<letter>') =", 'a1'.replace(/(?<letter>\w)(?<num>\d)/, '$<num>$<letter>'));
console.log('  ⚠️ 注意：匹配失败时 $`、$\' 会读到 undefined，注意防御。');
console.log("     'abc'.replace(/xyz/, \"[$`]\") =", 'abc'.replace(/xyz/, "[$`]"));

// 原生实现传函数时的参数签名
console.log('\n原生实现传函数时的参数签名（这是自定义实现最常对不齐的地方）：');
console.log('  fn(match, p1, p2, ..., offset, string, groups)');
console.log('  即：匹配串 → 各捕获组 → 匹配下标 → 原串 → 具名组对象');
'2024-05-06'.replace(/(?<y>\d+)-(?<m>\d+)/, (...args) => {
  // 最后一个参数是具名组对象
  const groups = args[args.length - 1];
  const string = args[args.length - 2];
  const offset = args[args.length - 3];
  const captures = args.slice(1, args.length - 3);
  console.log('    收到的完整参数：', JSON.stringify({ match: args[0], captures, offset, string, groups }));
  return 'X';
});
console.log('  ↑ 具名组对象只在正则里真的写了 (?<name>...) 时才不是 undefined。');

// 无捕获组时签名会更短
'abc'.replace(/b/, (...args) => {
  console.log('    无捕获组时参数只有 3 个：', JSON.stringify(args));
  return 'X';
});

// 具名组与捕获组同时存在时
'2024-05'.replace(/(?<y>\d+)-(\d+)/, (...args) => {
  console.log('    捕获组 + 具名组共存时：', JSON.stringify(args));
  return 'X';
});
console.log('  ↑ 具名组对象在最后，且只包含具名的那些组，普通捕获组不会进去。');

// ---------------------------------------------------------------------------
// 8. 真实场景：惰性模式对象
// ---------------------------------------------------------------------------

console.log('\n--- 8. 真实场景：惰性模式对象 ---');

/**
 * 惰性正则对象：真正的 RegExp 直到第一次被使用才构造。
 * 场景：模式串来自配置文件 / 远程下发，构造正则有一定成本，
 *       而很多对象的生命周期里可能一次都用不到（例如一堆校验规则里只触发几条）。
 */
function createLazyPattern(sourceFactory) {
  // 缓存：undefined 表示"还没构造过"
  let cached = null;
  /** 取（并缓存）真正的 RegExp，这个函数只在首次调用时执行工厂函数 */
  const getPattern = () => (cached ??= sourceFactory());

  return {
    /** 仅用于演示：观察是否已经构造过 */
    get isCompiled() {
      return cached !== null;
    },
    /** 暴露已编译的正则（没有就返回 null），方便调试 */
    get pattern() {
      return cached;
    },
    [Symbol.match](string) {
      // 到这里才真正构造正则
      return getPattern()[Symbol.match](string);
    },
    [Symbol.replace](string, replaceValue) {
      return getPattern()[Symbol.replace](string, replaceValue);
    },
    [Symbol.search](string) {
      return getPattern()[Symbol.search](string);
    },
    [Symbol.split](string, limit) {
      // 直接把 limit 转交给原生实现，它自己会正确处理
      return getPattern()[Symbol.split](string, limit);
    },
  };
}

// 构造一个"昂贵"的模式工厂：这里用计数模拟开销
let compileCount = 0;
const lazyDate = createLazyPattern(() => {
  compileCount++;
  console.log(`    （第 ${compileCount} 次构造正则：日期模式）`);
  return /(\d{4})-(\d{2})-(\d{2})/;
});

console.log('创建惰性对象后，isCompiled =', lazyDate.isCompiled, '，构造次数 =', compileCount);
console.log('第一次使用：');
console.log("  '2024-05-06'.match(lazyDate) =", JSON.stringify('2024-05-06'.match(lazyDate)));
console.log('  使用后 isCompiled =', lazyDate.isCompiled, '，构造次数 =', compileCount);
console.log('第二次使用（复用缓存）：');
console.log("  '1999-12-31'.match(lazyDate) =", JSON.stringify('1999-12-31'.match(lazyDate)));
console.log('  构造次数仍然是 =', compileCount, '← 只编译了一次');
console.log('\n换成 replace：');
console.log("  '2024-05-06'.replace(lazyDate, '$3/$2/$1') =", '2024-05-06'.replace(lazyDate, '$3/$2/$1'));
console.log("  '2024-05-06'.search(lazyDate) =", '2024-05-06'.search(lazyDate));
console.log("  '2024-05-06'.split(lazyDate) =", JSON.stringify('2024-05-06'.split(lazyDate)));
console.log('  构造次数依然 =', compileCount, '← 四个协议方法都复用同一个缓存');
console.log('  ↑ 注意 split 的 limit 是直接转发给原生实现的，所以不用自己处理。');

// ---------------------------------------------------------------------------
// 9. 一个重要的反作用：IsRegExp 与 Symbol.match = false
// ---------------------------------------------------------------------------

console.log('\n--- 9. Symbol.match 的副作用：IsRegExp 检查 ---');

// 规范里有个内部操作 IsRegExp(argument)：
//   若 argument 不是对象 → false
//   若 argument[Symbol.match] 不是 undefined → 返回 ToBoolean(它)
//   否则 → 看它是不是真的 RegExp
// 所以 Symbol.match 不只是"让 match 能用"，它还决定了
// "这个对象是否被当成正则" —— 影响 startsWith / endsWith / includes / replaceAll。

console.log('没有改 Symbol.match 时：');
try {
  console.log("  'abc'.startsWith(/a/) =", 'abc'.startsWith(/a/));
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
console.log('  ↑ 明明是字符串方法，却因为第一个参数是正则而报错，这是很多人的困惑点。');

// 经典解法：把 Symbol.match 设成 false，正则就被"降级"成普通对象
console.log('\n把 /a/ 的 Symbol.match 设为 false 之后：');
const reNoMatch = /a/;
reNoMatch[Symbol.match] = false;
console.log("  reNoMatch[Symbol.match] =", reNoMatch[Symbol.match]);
console.log("  'abc'.startsWith(reNoMatch) =", 'abc'.startsWith(reNoMatch));
console.log('  ↑ 这次它按"字符串"语义工作了。');
console.log('    原理：IsRegExp 读到 Symbol.match 是假值，就判定"这不是正则"。');
console.log('    副作用：这个正则从此不能再用于 str.match() 等 —— 而且是直接报错：');
try {
  // 注意这里抛错的原因：GetMethod 在 Symbol.match 上读到了 false，
  // 它既不是 undefined（"没有这个方法"）也不是函数，于是立即抛 TypeError。
  console.log("      'abc'.match(reNoMatch) =", JSON.stringify('abc'.match(reNoMatch)));
} catch (err) {
  console.log('      抛出：', err.constructor.name, '-', err.message);
}
console.log('    ↑ 对比一下两种"没有方法"的区别，这是理解 GetMethod 的关键：');
// 情况 A：属性不存在（undefined）→ 静默降级，不报错
const noProp = /a/;
// 这里用 delete 把它彻底删掉，而不是设成 false
delete noProp[Symbol.match];
console.log("      属性不存在 → 'abc'.match(它) =", JSON.stringify('abc'.match(noProp)), '（降级为 new RegExp(对象)，不报错）');
// 情况 B：属性存在但不是函数 → 抛 TypeError
console.log('      属性为 false（存在但不可调用）→ 抛 TypeError（上面那个）');
console.log('      → 所以 "关掉正则检查" 的代价是 "这个正则不能再被 str.match 使用"，');
console.log('        只适合"本来就要把它当字符串用"的场景。');

// 反过来：一个普通对象只要 Symbol.match 是"真值"，就会被当成正则
const pseudoRegexLike = { [Symbol.match]: true, toString: () => 'a' };
console.log('\n普通对象只要 Symbol.match 是真值，也会被当成正则：');
try {
  console.log("  'abc'.includes(pseudoRegexLike) =", 'abc'.includes(pseudoRegexLike));
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
const pseudoFalsy = { [Symbol.match]: false, toString: () => 'a' };
console.log("  改成 false 后：'abc'.includes(pseudoFalsy) =", 'abc'.includes(pseudoFalsy));

// replaceAll 的检查
console.log('\nreplaceAll 的"必须带 g"检查：');
try {
  console.log("  'abc'.replaceAll(/a/, 'X') =", 'abc'.replaceAll(/a/, 'X'));
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
console.log("  带 g 后：'abc'.replaceAll(/a/g, 'X') =", 'abc'.replaceAll(/a/g, 'X'));
// 自定义对象不是 RegExp，绕过了这个检查
const customAll = { [Symbol.replace]: (s) => `(自定义实现处理了全部: ${s})` };
console.log("  自定义对象：'aaa'.replaceAll(customAll, 'X') =", 'aaa'.replaceAll(customAll, 'X'));
console.log('  ↑ 自定义对象不是 RegExp，绕过了 g 检查；');
console.log('    但"替换全部"的语义必须由你自己在 Symbol.replace 里实现。');

// ---------------------------------------------------------------------------
// 10. 综合实战：一个完整的"伪正则"对象
// ---------------------------------------------------------------------------

console.log('\n--- 10. 综合实战：完整的伪正则对象 ---');

/**
 * MaskedId —— 一个把"身份证/手机号脱敏"封装成伪正则的对象。
 * 它同时实现四个协议方法，所以能像正则一样用在 match / replace / search / split 上。
 */
function createMaskedId(options = {}) {
  const { maskChar = '*', keepHead = 3, keepTail = 4 } = options;

  /** 内部辅助：找出所有"长数字串"的区间 */
  const findRuns = (string) => {
    const runs = [];
    const re = /\d+/g;
    let m;
    while ((m = re.exec(string)) !== null) {
      // 只处理长度足够的串，避免把年份之类的短数字也脱敏
      if (m[0].length >= keepHead + keepTail) {
        runs.push({ start: m.index, value: m[0] });
      }
    }
    return runs;
  };

  /** 内部辅助：把一段数字串脱敏 */
  const mask = (value) =>
    value.slice(0, keepHead) + maskChar.repeat(value.length - keepHead - keepTail) + value.slice(-keepTail);

  return {
    maskChar,
    /** 找出所有需要脱敏的片段，返回类 match 数组的数组 */
    [Symbol.match](string) {
      const runs = findRuns(string);
      if (runs.length === 0) return null;
      return runs.map(({ start, value }) => {
        const item = [value];
        item.index = start;
        item.input = string;
        item.masked = mask(value);
        item.groups = undefined;
        return item;
      });
    },
    /** 脱敏并返回新字符串；replaceValue 为函数时可自定义每段的处理 */
    [Symbol.replace](string, replaceValue) {
      const runs = findRuns(string);
      if (runs.length === 0) return string;
      // 从左到右拼接，避免多次 replace 造成下标错乱
      let out = '';
      let cursor = 0;
      for (const { start, value } of runs) {
        out += string.slice(cursor, start);
        out += typeof replaceValue === 'function'
          ? replaceValue(value, start, string)
          : mask(value);
        cursor = start + value.length;
      }
      out += string.slice(cursor);
      return out;
    },
    /** 返回第一个需要脱敏片段的下标 */
    [Symbol.search](string) {
      const runs = findRuns(string);
      return runs.length > 0 ? runs[0].start : -1;
    },
    /** 按"数字串"切分，保留分隔文本 */
    [Symbol.split](string, limit) {
      const runs = findRuns(string);
      const parts = [];
      let cursor = 0;
      for (const { start, value } of runs) {
        parts.push(string.slice(cursor, start));
        parts.push(value);
        cursor = start + value.length;
      }
      parts.push(string.slice(cursor));
      // limit 必须自己处理
      return limit === undefined ? parts : parts.slice(0, Math.max(0, limit));
    },
  };
}

const maskedId = createMaskedId();
const privacyText = '用户 13812345678 于 2024-05-06 下单，身份证 110101199003072316';

console.log('对象是 RegExp 实例吗：', maskedId instanceof RegExp);
console.log('原文：', privacyText);
console.log('');
console.log('match  →', JSON.stringify(maskedId[Symbol.match](privacyText).map((m) => `${m[0]}@${m.index}`)));
console.log('replace →', privacyText.replace(maskedId, undefined));
console.log('search →', privacyText.search(maskedId));
console.log('split  →', JSON.stringify(privacyText.split(maskedId).slice(0, 5)), '…');
console.log('');
console.log('replace 传函数（自定义每段脱敏策略）：');
console.log(
  '  ',
  privacyText.replace(maskedId, (value, offset) => `【${value.length}位@${offset}】`),
);
console.log('');
console.log('split 带 limit：');
console.log('  limit=3 →', JSON.stringify(privacyText.split(maskedId, 3)));

// 最后统一展示：同一批字符串方法，正则能用，伪正则也能用
console.log('\n同一批字符串方法在两种对象上的对照：');
const realRe = /\d{11}/;
const methods = [
  ['match', (obj) => privacyText.match(obj) !== null],
  ['replace', (obj) => privacyText.replace(obj, 'X').length],
  ['search', (obj) => privacyText.search(obj)],
];
for (const [name, fn] of methods) {
  console.log(`  ${name.padEnd(9)} 正则 → ${String(fn(realRe)).padEnd(6)} 伪正则 → ${fn(maskedId)}`);
}
console.log('  ↑ 字符串方法对两者一视同仁，因为它们走的是同一套 symbol 协议。');

// ---------------------------------------------------------------------------
// 11. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 11. 小结 ---');

console.log('1) 五个协议方法（well-known symbol）：');
console.log('     Symbol.match / Symbol.replace / Symbol.search / Symbol.split / Symbol.matchAll');
console.log('2) 调用签名：');
console.log('     [Symbol.match](str) → 类数组|null');
console.log('     [Symbol.replace](str, replaceValue) → string');
console.log('     [Symbol.search](str) → number（-1 表示未命中）');
console.log('     [Symbol.split](str, limit) → string[]（limit 必须自己截断！）');
console.log('     [Symbol.matchAll](str) → 迭代器');
console.log('3) 分派顺序：字符串方法先 GetMethod 取 symbol 属性，');
console.log('     · 是函数        → 调用它（this 指向你的对象）；');
console.log('     · 不是 undefined 又不可调用 → 立即抛 TypeError（如设成 false / 数字）；');
console.log('     · 是 undefined  → 静默降级：match/search 走 new RegExp(值)，');
console.log('                        replace/split 走 ToString(值)（都不报错，最容易埋雷）。');
console.log('4) RegExp.prototype 上原生就有这五个方法，所以"正则"只是这套协议的默认实现。');
console.log('     想复用原生行为：RegExp.prototype[Symbol.replace].call(re, str, repl)。');
console.log('5) 原生 replace 支持 $& / $` / $\' / $1 / $<name> / $$ 替换模板，');
console.log('     自定义实现默认不支持，需要自己解析（或转发给原生实现）。');
console.log('6) Symbol.match 还有副作用：它决定 IsRegExp 的判定结果，');
console.log('     影响 startsWith / endsWith / includes / replaceAll；');
console.log('     re[Symbol.match] = false 是老代码里让正则"能当字符串用"的经典技巧。');
console.log('7) 真实用途：DSL、模板引擎、惰性模式对象、可替换的正则实现（RE2/WASM）。');
console.log('8) 相关阅读：13_regexp/11_string_methods_with_regex.js（字符串方法配合正则）、');
console.log('     13_regexp/10_replace_with_function.js（replace 传函数的细节）。');

console.log('\n全部演示完毕。');
