/**
 * ============================================================================
 * 知识点：用 Proxy 实现 Python 风格负索引数组与"默认值对象"
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】进阶
 * 【前置知识】25_proxy_and_reflect/02_get_set_traps.js 与 03_has_delete_traps.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本文件用 Proxy 做两件"改造语言习惯"的事：
 *      a) **负索引数组**：让 arr[-1] 表示最后一个元素、arr[-2] 表示倒数第二个，
 *         就像 Python / Ruby 那样；
 *      b) **默认值对象**（defaultdict）：读取不存在的键时自动创建它，
 *         于是 counts[word] += 1 不再需要先判断键是否存在。
 *    这两件事都无法用语法糖实现，必须拦截属性访问 —— 正是 Proxy 的主场。
 *
 * 2. 为什么需要
 *    - 取最后一个元素在 JS 里要写 arr[arr.length - 1]，冗长且容易写错
 *      （ES2022 的 arr.at(-1) 只是缓解，仍需多打几个字符，且老代码用不了）。
 *    - 分组统计、构建树形结构、缓存计算等场景里，
 *      "键不存在就创建"是重复率最高的模式之一，手写判断既啰嗦又容易漏。
 *    这两种需求都是"语言层面可以更舒服，但 JS 没提供"的典型例子，
 *    用 Proxy 可以在不改动运行时的情况下补上。
 *
 * 3. 核心语法要点
 *    - 判断"是不是负索引"：/^-\d+$/ 这样的正则（属性名到达陷阱时一定是字符串）。
 *    - 负索引换算：实际下标 = target.length + 负数。
 *      例如长度为 5 时，-1 -> 4，-5 -> 0。
 *    - 陷阱内部转成正索引后再转发给目标对象，就完成了"语法伪装"。
 *    - 默认值对象的 get 陷阱：键不存在时先创建再返回。
 *    - 想让自动创建的键出现在 Object.keys / for...in 里，
 *      只要它在目标对象上真实存在就够了（我们确实写了进去）。
 *    - 想让 in 运算符也返回 true，需要额外实现 has 陷阱。
 *    - 空数组上访问 arr[-1] 要返回 undefined 而不是创建怪属性 —— 边界要想清楚。
 *
 * 4. 常见陷阱
 *    - **原始数组上写 arr[-1] 不会报错**，它只是给对象加了一个名为 "-1" 的普通属性，
 *      length 不变，遍历也看不到 —— 这是最典型的"静默错误"。本文件开头就演示它。
 *    - 负索引只对"读/写单个元素"有意义；slice 本来就支持负数，不要重复实现。
 *    - 数组的很多方法（map/filter/forEach）内部用的是非负整数下标，
 *      所以代理后它们照常工作，不需要额外处理。
 *    - 默认值对象如果无限制地自动创建键，会让 JSON.stringify 输出一堆空对象，
 *      也会造成内存增长 —— 生产环境要谨慎。
 *    - 每次 get 都新建默认值是错的：`dd.a === dd.a` 会变成 false。
 *      必须缓存，或保证存进目标对象后复用同一个值。
 *    - 用 === 比较负数下标与转换后的正数下标时要小心类型（陷阱里 key 一定是字符串）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/07_negative_array_index.js
 *
 * 【预期输出】
 *   打印原生数组的负索引陷阱、代理后的负索引读写效果，以及默认值对象的自动创建过程。
 * ============================================================================
 */

console.log('--- 1. 先看原生数组的负索引陷阱 ---');

const plain = ['a', 'b', 'c'];

// 写 arr[-1] 不会报错，但也不会修改最后一个元素。
plain[-1] = 'X';
console.log('执行 plain[-1] = "X" 之后：');
console.log('  JSON =', JSON.stringify(plain), '（最后一个元素没有变！）');
console.log('  length =', plain.length, '（长度也没变）');
console.log('  但对象上确实多了一个属性 "-1" =', plain['-1'], '（这就是那个"隐形"的属性）');
// 这个 "-1" 是一个普通的可枚举属性，所以 Object.keys 会列出它，
// 但它不是"数组元素"，不会被 JSON.stringify 与数组迭代当成内容。
console.log('  Object.keys 列出 =', JSON.stringify(Object.keys(plain)), '（多了个 "-1"）');
console.log('  JSON.stringify 却只有 =', JSON.stringify(plain), '（长度属性与普通属性不算元素）');

// 读不存在的负下标只会得到 undefined。
console.log('plain[-1] 读出来 =', plain[-1], '（读到的就是这个怪异属性，不是最后一个元素）');
console.log('  -> 想读最后一个元素，原生只能 plain[plain.length - 1] 或 plain.at(-1)');
console.log('  -> at(-1) 的结果是 =', plain.at(-1));

console.log('--- 2. 用 Proxy 实现负索引 ---');

/**
 * 把数组包装成支持 Python 风格负索引的代理。
 * 约定：-1 = 最后一个，-2 = 倒数第二个，依此类推；
 *       越界的负索引读返回 undefined，写则被忽略（保持简单可预测）。
 */
function negativeIndexArray(array) {
  const isNegativeIndex = (key) => typeof key === 'string' && /^-\d+$/.test(key);

  return new Proxy(array, {
    // 读：把负下标换算成正下标
    get(tgt, key, receiver) {
      if (isNegativeIndex(key)) {
        const index = tgt.length + Number(key); // 例：length 5，key "-1" -> 4
        if (index < 0 || index >= tgt.length) return undefined;
        return Reflect.get(tgt, String(index), receiver);
      }
      return Reflect.get(tgt, key, receiver);
    },

    // 写：同样换算，越界就忽略
    set(tgt, key, value, receiver) {
      if (isNegativeIndex(key)) {
        const index = tgt.length + Number(key);
        if (index < 0 || index >= tgt.length) {
          console.log(`  [set] 负下标 ${key} 越界，忽略这次写入`);
          return true; // 报告"成功"，但不做任何事
        }
        return Reflect.set(tgt, String(index), value, receiver);
      }
      return Reflect.set(tgt, key, value, receiver);
    },

    // 删除：也支持负下标
    deleteProperty(tgt, key) {
      if (isNegativeIndex(key)) {
        const index = tgt.length + Number(key);
        if (index < 0 || index >= tgt.length) return true;
        // delete 数组元素会留下一个"空洞"，长度不变（与原生 delete 行为一致）。
        return Reflect.deleteProperty(tgt, String(index));
      }
      return Reflect.deleteProperty(tgt, key);
    },

    // in 运算符也支持负下标，保持一致的手感
    has(tgt, key) {
      if (isNegativeIndex(key)) {
        const index = tgt.length + Number(key);
        return index >= 0 && index < tgt.length && Reflect.has(tgt, String(index));
      }
      return Reflect.has(tgt, key);
    },
  });
}

const py = negativeIndexArray(['a', 'b', 'c', 'd', 'e']);

console.log('数组 =', JSON.stringify(py), ', 长度 =', py.length);
console.log('py[-1] =', py[-1], '（最后一个）');
console.log('py[-2] =', py[-2], '（倒数第二个）');
console.log('py[-5] =', py[-5], '（倒数第五个 = 第一个）');
console.log('py[-6] =', py[-6], '（越界，返回 undefined）');
console.log('py[0]  =', py[0], '（正索引照常工作）');

console.log('--- 3. 负索引下的写与删 ---');

py[-1] = 'E'; // 相当于 py[4] = 'E'
console.log('py[-1] = "E" 之后 =', JSON.stringify(py));

py[-5] = 'A';
console.log('py[-5] = "A" 之后 =', JSON.stringify(py));

py[-10] = '出界'; // 越界写被忽略
console.log('py[-10] = "出界" 之后 =', JSON.stringify(py), '（没有变化）');

delete py[-1];
console.log('delete py[-1] 之后 =', JSON.stringify(py), '（位置上留下空洞，长度不变）');

console.log('"-3" in py =', '-3' in py, ', "-99" in py =', '-99' in py);

console.log('--- 4. 数组方法在代理上照常工作 ---');

// 这些方法内部使用的是 0、1、2…… 这样的非负下标，所以完全不需要改动。
console.log('map 结果  =', JSON.stringify(py.map((x) => (x ? x.toLowerCase() : null))));
console.log('filter 结果 =', JSON.stringify(py.filter(Boolean)));
console.log('slice(-2) 结果 =', JSON.stringify(py.slice(-2)), '（slice 本来就支持负数）');
console.log('includes("c") =', py.includes('c'));
console.log('join =', py.join('|'));

// push / pop 会读写 length 与正下标，所以也没问题。
py.push('f');
console.log('push("f") 后 =', JSON.stringify(py), ', 现在 py[-1] =', py[-1]);
const popped = py.pop();
console.log('pop() 得到 =', popped, ', 现在 py[-1] =', py[-1]);

// 迭代器也是用正下标实现的，不受影响。
console.log('for...of =', (() => {
  const out = [];
  for (const item of py) out.push(item ?? '空');
  return out.join(',');
})());

console.log('--- 5. 把负索引能力封装成"工具函数" ---');

// 也可以做成一个直接接收索引的函数，不依赖代理 —— 对比两种做法的差别。
function at(array, index) {
  return index < 0 ? array[array.length + index] : array[index];
}

const normal = ['x', 'y', 'z'];
console.log('函数版 at(normal, -1) =', at(normal, -1));
console.log('函数版 at(normal, -3) =', at(normal, -3));
console.log('  -> 函数版更简单直接，但要求每次调用都写 at(arr, -1)；');
console.log('     代理版写起来像原生语法，代价是每次属性访问都要过一遍陷阱（有性能开销）');
console.log('     该用哪种，取决于这个能力是"偶尔用一次"还是"贯穿整个模块"');

console.log('--- 6. 默认值对象：键不存在就自动创建 ---');

/**
 * 创建一个"读不存在的键时自动填默认值"的对象。
 * @param {() => any} factory 生成默认值的函数（每次创建新键时调用）
 */
function withDefault(factory) {
  const target = {};

  return new Proxy(target, {
    get(tgt, key, receiver) {
      // 非字符串键（symbol）直接放行，避免干扰引擎内部探测。
      if (typeof key !== 'string') return Reflect.get(tgt, key, receiver);

      // 重要：JSON.stringify 会先读一次 toJSON 来判断"该怎么序列化这个对象"。
      // 如果不特判，这个探测动作就会凭空创建一个叫 toJSON 的键 —— 纯粹的污染。
      if (key === 'toJSON') return undefined;

      if (!Object.hasOwn(tgt, key)) {
        // 自动创建：这一步让"读"操作产生了"写"的副作用。
        const value = factory(key);
        console.log(`  [withDefault] 键 "${key}" 不存在，自动创建默认值`);
        Reflect.set(tgt, key, value);
      }
      return Reflect.get(tgt, key, receiver);
    },

    // 让 in 也返回 true，符合"任何键都存在"的心智模型。
    has() {
      return true;
    },
  });
}

const stats = withDefault(() => 0);

// 因为读出来是 0，所以直接 += 1 就能用。
stats.apple += 1;
stats.apple += 1;
stats.banana += 1;
stats.cherry += 5;

console.log('统计结果 =', JSON.stringify(stats));
console.log('Object.keys 能看到自动创建的键吗？', JSON.stringify(Object.keys(stats)), '（能，因为确实写进了目标对象）');
console.log('"任意键" in stats =', '任意键' in stats, '（has 陷阱让它永远为 true）');
console.log('  -> 对比手写版本：if (!(k in obj)) obj[k] = 0; obj[k] += 1;');
console.log('     代理版本完全去掉了这段样板代码');

console.log('--- 7. 自动构建嵌套结构（树形累加） ---');

/**
 * 自动生长的树：读任意属性都会得到下一层，可以无限链式访问。
 */
function autoTree(leafFactory) {
  const target = {};
  const cache = new Map(); // 键 -> 已经创建好的子代理（保证身份稳定）

  return new Proxy(target, {
    get(tgt, key, receiver) {
      if (typeof key !== 'string') return Reflect.get(tgt, key, receiver);

      // 内置的 JSON 序列化会读取 toJSON，不能把它当成普通键自动创建。
      if (key === 'toJSON') return undefined;

      if (!Object.hasOwn(tgt, key)) {
        const child = autoTree(leafFactory);
        Reflect.set(tgt, key, child);
        cache.set(key, child);
      }
      return cache.get(key) ?? Reflect.get(tgt, key, receiver);
    },
    set(tgt, key, value, receiver) {
      // 真正赋值时，替换掉"自动生成的子树"，写入真实的值。
      cache.delete(key);
      return Reflect.set(tgt, key, value, receiver);
    },
  });
}

// 场景：把 "a.b.c" 这样的路径字符串累加成嵌套对象。
const tree = autoTree(() => 0);

function addPath(root, path, value) {
  const parts = path.split('.');
  let node = root;
  // 前面几层用代理自动生长。
  for (let i = 0; i < parts.length - 1; i += 1) {
    node = node[parts[i]];
  }
  const last = parts[parts.length - 1];
  // 最后一层做真正的累加。
  const current = typeof node[last] === 'number' ? node[last] : 0;
  node[last] = current + value;
  return node;
}

addPath(tree, 'api.users.list', 10);
addPath(tree, 'api.users.get', 25);
addPath(tree, 'api.users.list', 5); // 累加到同一个位置
addPath(tree, 'web.home', 3);

console.log('累加后的树 =', JSON.stringify(tree, null, 0));
console.log('直接读深层路径 tree.api.users.list =', tree.api.users.list);
console.log('  -> 全程没有写过一句"如果不存在就创建"的判断，路径有多深都能自动铺好');

console.log('--- 8. 关键细节：默认值的"身份"必须稳定 ---');

// 上面 autoTree 用了 cache 保证同一个键返回同一个对象。
// 如果不缓存，会出现"每次读都是新对象"的诡异现象：
const tree2 = autoTree(() => 0);
const a1 = tree2.a;
const a2 = tree2.a;
console.log('tree2.a === tree2.a 吗？', a1 === a2, '（有缓存，所以是同一个代理）');
console.log('  -> 如果缓存没做好，a1.x 与 a2.x 会是两个不同的地方，累加数据就会莫名其妙丢失');

console.log('--- 9. 默认值对象的代价与风险 ---');

// 风险一：一次误读就会污染数据结构。
const risky = withDefault(() => ({}));
const nothing = risky.typoKey; // 只是想看看有没有这个键
console.log('只是"看一眼" risky.typoKey，结果对象变成了 =', JSON.stringify(risky));
console.log('  再检查一下键 =', JSON.stringify(Object.keys(risky)));
console.log('  -> 读操作产生写副作用，调试时看到的数据可能是"被看过"才出现的');

// 风险二：JSON.stringify 会把自动创建的键全部输出。
const grouped = withDefault(() => []);
grouped.fruit.push('apple');
console.log('分组结果 =', JSON.stringify(grouped), '（符合预期）');

// 风险三：判断"有没有这个键"必须用 Object.hasOwn，不能用代理的 in。
console.log('Object.hasOwn(grouped, "fruit") =', Object.hasOwn(grouped, 'fruit'));
console.log('Object.hasOwn(grouped, "veggie") =', Object.hasOwn(grouped, 'veggie'), '（还没被创建）');
console.log('"veggie" in grouped =', 'veggie' in grouped, '（has 陷阱让它说谎了）');

// 正确的"存在性判断"要用一个不受陷阱影响的通道 —— 例如只读的 Object.hasOwn。
console.log('  -> 结论：默认值对象很好用，但要清楚它会"撒谎"，');
console.log('     在需要精确判断键是否存在的场景里，务必用 Object.hasOwn 而不是 in');

console.log('--- 10. 两种能力的边界：别过度使用 ---');

console.log('负索引：适合"经常取末尾元素"的场景（如栈、队列、日志尾部）');
console.log('        不适合给每一个数组都套一层代理 —— 每次访问都要执行陷阱函数，是实打实的开销');
console.log('默认值对象：适合统计、分组、建树这类"读即创建"的语义');
console.log('        不适合通用数据结构 —— 隐式创建会让 bug 更难发现');

// 简单量一下开销（数字仅供参考，不同机器差异很大）。
const N = 100_000;
const raw = new Array(1000).fill(1);
const proxied = negativeIndexArray(new Array(1000).fill(1));

let t = process.hrtime.bigint();
for (let i = 0; i < N; i += 1) void raw[i % 1000];
const rawNs = Number(process.hrtime.bigint() - t);

t = process.hrtime.bigint();
for (let i = 0; i < N; i += 1) void proxied[i % 1000];
const proxyNs = Number(process.hrtime.bigint() - t);

console.log(`\n${N} 次读取：原生数组 ${rawNs} ns，代理数组 ${proxyNs} ns，` +
  `约 ${(proxyNs / rawNs).toFixed(1)} 倍开销`);
console.log('  -> 代理不是免费的，热路径上的属性访问要谨慎使用');

console.log('\n全部演示完毕。');
