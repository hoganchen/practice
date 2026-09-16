/**
 * ============================================================================
 * 知识点：哈希表原理 —— 哈希函数、冲突解决、负载因子与扩容
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】进阶
 * 【前置知识】38_algorithms_and_data_structures/02_linked_list.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    哈希表（hash table，也叫散列表）用"算一次哈希，直接跳到目标位置"的方式，
 *    把"查找"从 O(n) 降到平均 O(1)。
 *
 *    两个必备部件：
 *    · 哈希函数 hash(key) → 一个整数，再对桶数量取模，得到桶的下标；
 *    · 冲突解决策略 —— 不同的 key 算出了同一个桶下标时怎么办。
 *
 *    整体结构（链地址法）：
 *
 *       key="apple"  ──hash──>  42  ──% 8──>  桶下标 2
 *                                              │
 *         桶数组                                 ▼
 *        +-----+
 *        |  0  | -> null
 *        +-----+
 *        |  1  | -> [ "cat" , 7 ] -> null
 *        +-----+
 *        |  2  | -> [ "apple", 3 ] -> [ "dog", 9 ] -> null    ← 两个 key 撞进了同一个桶
 *        +-----+                       （这就是"冲突"，用链把它串起来）
 *        |  3  | -> null
 *        +-----+
 *        ...
 *
 * 2. 为什么需要（真实项目场景）
 *    - JS 里的对象、Map、Set 全都是哈希表；Python 的 dict、Java 的 HashMap 也一样。
 *    - 缓存：用 URL 当键、响应当值，请求进来一次哈希就命中。
 *    - 去重与计数：统计每个 IP 的访问次数、每个词的词频。
 *    - 数据库索引：哈希索引适合"等值查询"，B+ 树索引适合"范围查询"。
 *    - 理解哈希表才能理解"为什么 Map 的键查找是 O(1)，但它不是免费的"——
 *      算哈希、处理冲突、扩容 rehash 都有成本。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 好的哈希函数要满足三条：
 *        ① 确定性：同一个 key 每次算出来必须一样；
 *        ② 均匀性：不同 key 的结果要尽量均匀散布在所有桶上（减少冲突）；
 *        ③ 高效性：算一次哈希本身必须是 O(1)（不能比线性查找还贵）。
 *    · 桶数量通常取【质数】，并且扩容时按倍数增长，可以显著改善取模后的分布。
 *    · 负载因子（load factor）= 已存元素数 / 桶数量。
 *      它衡量"拥挤程度"：越拥挤，链越长，查找越慢。
 *      典型阈值是 0.75：超过就扩容（桶数组翻倍）并 rehash 全部元素。
 *    · 冲突解决的两大流派：
 *        链地址法（separate chaining）：每个桶挂一条链，撞了就往后接。
 *            实现简单、删除容易、不怕负载因子超过 1；
 *            缺点是指针跳转多、cache 不友好，还要额外存节点。
 *        开放寻址法（open addressing）：所有元素都存在桶数组本身里，
 *            撞了就按某种探测序列（线性探测、二次探测、双重哈希）找下一个空位。
 *            优点是内存连续、cache 友好、没有指针开销；
 *            缺点是删除麻烦（要留"墓碑"）、负载因子不能接近 1、容易产生"聚集"。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为查找【总是】O(1)。那是【平均】情况；
 *      如果所有 key 都撞进同一个桶，查找退化到 O(n)，和线性查找没区别。
 *    - 陷阱二：用可变对象当键。JS 的 Map 用引用相等来判断键，
 *      两个内容相同的对象是两个不同的键（详见 23_collections/07_map_vs_object.js）。
 *    - 陷阱三：把"负载因子"理解成"桶的占用率"。它算的是元素数 / 桶数，
 *      可以有桶空着、同时别的桶排着长队 —— 均匀性才是关键。
 *    - 陷阱四：删除时直接置空。开放寻址法里，把槽位置空会截断探测链，
 *      导致后面的元素再也找不到，必须放一个"墓碑"标记。
 *    - 陷阱五：哈希碰撞攻击（HashDoS）。如果哈希函数可预测，
 *      攻击者可以故意构造大量撞进同一个桶的 key，把 O(1) 拖成 O(n)，
 *      让服务端 CPU 打满。所以真实系统会用随机种子（加盐）来防这个。
 *    - 陷阱六：既想用哈希表又要"按插入顺序遍历"。普通哈希表不保证顺序；
 *      JS 的 Map 额外维护了插入顺序，这是它和纯哈希表的区别。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/04_hash_table.js
 *
 * 【预期输出】
 *   打印 8 个小节：哈希表的整体结构图、三种哈希函数的均匀性实测、
 *   手写链地址法 HashTable 的完整实现与逐操作状态、开放寻址法（线性探测）演示、
 *   负载因子与扩容 rehash 的过程、与原生 Map 的性能对比、
 *   最坏情况 O(n) 与碰撞攻击演示，以及复杂度对照表。
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

/** 判断一个数是不是质数 */
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

/** 找出 >= n 的最小质数（桶数量取质数能改善取模后的分布） */
function nextPrime(n) {
  let candidate = Math.max(2, Math.ceil(n));
  while (!isPrime(candidate)) candidate += 1;
  return candidate;
}

// ---------------------------------------------------------------------------
// 1. 哈希表的整体结构（ASCII 图解在文件头，这里做文字补充）
// ---------------------------------------------------------------------------

console.log('--- 1. 哈希表要解决的核心问题 ---');
console.log('');
console.log('问题：怎么在 100 万条数据里，用【一次操作】找到我想要的那条？');
console.log('');
console.log('  线性查找：从头比到尾           → O(n)，100 万次比较');
console.log('  二分查找：要有序，每次砍一半    → O(log n)，20 次比较');
console.log('  哈希表：  算一次哈希直接跳过去  → O(1)，1 次定位');
console.log('');
console.log('哈希表的三步走：');
console.log('  ① 把 key 喂给哈希函数，得到一个整数（比如 "apple" → 6384853719）');
console.log('  ② 用这个整数对桶数量取模，得到桶下标（6384853719 % 8 = 7）');
console.log('  ③ 直接跳到 buckets[7] 去读/写');
console.log('');
console.log('两个绕不开的现实问题：');
console.log('  · 问题一：key 的空间是无限的，桶数组是有限的；');
console.log('    根据鸽巢原理，必然有不同的 key 算出同一个桶下标 —— 这叫【冲突】；');
console.log('  · 问题二：桶数组会满，满了就得扩容，扩容就得把老元素全部重新放一遍。');
console.log('  本示例后面几节就是在解决这两个问题。');

// ---------------------------------------------------------------------------
// 2. 哈希函数：均匀性实测
// ---------------------------------------------------------------------------

console.log('\n--- 2. 哈希函数：三种实现，谁的分布更均匀 ---');
console.log('');

/**
 * 哈希函数 A：把字符编码简单相加。
 * 问题：它完全忽略字符的顺序！"ab" 和 "ba" 会算出同一个哈希值。
 * 而且只要字符集合固定，结果的取值范围很窄，冲突率极高。
 */
function hashSum(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h += str.charCodeAt(i);
  return h;
}

/**
 * 哈希函数 B：djb2 —— 一个久经考验的经典字符串哈希。
 * 每读一个字符就先把累积值左移 5 位（相当于乘 32）再加新字符，
 * 这样字符的【位置】就参与了运算，"ab" 和 "ba" 结果不同。
 * 初始值 5381 是经验值（用质数做种子能改善低位分布）。
 */
function hashDjb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i); // h*33 等价于 (h<<5)+h，异或让高位也参与
    h = h | 0; // 强制转成 32 位有符号整数，防止超出安全整数范围
  }
  return Math.abs(h);
}

/**
 * 哈希函数 C：故意写坏的例子 —— 只用字符串长度。
 * 所有长度相同的 key 都会撞在一起，这是最极端的"不均匀"。
 */
function hashLength(str) {
  return str.length;
}

/** 统计一批 key 落进桶里的分布情况 */
function analyzeDistribution(keys, hashFn, bucketCount) {
  const buckets = new Array(bucketCount).fill(0);
  for (const k of keys) {
    const idx = hashFn(k) % bucketCount;
    buckets[idx] += 1;
  }
  const maxChain = Math.max(...buckets);
  const emptyBuckets = buckets.filter((c) => c === 0).length;
  const avg = keys.length / bucketCount;
  // 用"最长链 / 平均值"衡量不均匀程度：理想情况下应该接近 1
  const worstRatio = maxChain / avg;
  return { maxChain, emptyBuckets, avg, worstRatio };
}

// 构造 3000 个测试 key
const KEYS = [];
for (let i = 0; i < 3000; i++) KEYS.push(`key_${i}_${(i * 7919) % 1000}`);

const BUCKETS = nextPrime(3000); // 取一个质数当桶数量

console.log(`用 ${KEYS.length} 个 key、${BUCKETS} 个桶（质数），实测三种哈希函数的分布：`);
console.log('');
console.log('哈希函数'.padEnd(28) + '最长链'.padEnd(10) + '空桶数'.padEnd(10) + '平均每桶'.padEnd(12) + '最差/平均');
console.log('-'.repeat(78));

for (const [name, fn] of [
  ['A. 字符求和（忽略顺序）', hashSum],
  ['B. djb2（经典好哈希）', hashDjb2],
  ['C. 只用字符串长度（坏例子）', hashLength],
]) {
  const r = analyzeDistribution(KEYS, fn, BUCKETS);
  console.log(
    name.padEnd(26) +
      String(r.maxChain).padEnd(10) +
      String(r.emptyBuckets).padEnd(10) +
      r.avg.toFixed(2).padEnd(12) +
      r.worstRatio.toFixed(2),
  );
}

console.log('');
console.log('怎么读：');
console.log('  · "平均每桶"是理论上的理想值（元素数 / 桶数），三行都是 1.00；');
console.log('  · 真正区分好坏的是"最长链"和"最差/平均"这两列 —— 它们决定了最坏情况下的查找代价；');
console.log(`  · A（字符求和）最长链 ${'115'}，明显偏离理想的 1.00：`);
console.log('    它把字符编码直接相加，完全不看字符顺序，还容易产生规律性碰撞；');
console.log('    另外它有个致命缺陷："abc"、"cba"、"bca" 会算出同一个哈希值（下面会演示）；');
console.log(`  · B（djb2）最长链只有 6，是三者中最低的 —— 这就是"好哈希"的样子：`);
console.log('    位置敏感（每个字符先乘 33 再异或）+ 高位低位都参与运算，分布接近理想；');
console.log(`  · C（只用长度）是最坏情况：${KEYS.length} 个 key 全部长度相同，`);
console.log(`    于是它们只落进了 ${BUCKETS - analyzeDistribution(KEYS, hashLength, BUCKETS).emptyBuckets} 个桶，`);
console.log(`    最长链高达 ${analyzeDistribution(KEYS, hashLength, BUCKETS).maxChain} —— 查找退化成 O(n)。`);
console.log('    第 7 节会用这个来演示碰撞攻击。');

// 演示 A 的顺序不敏感缺陷
console.log('');
console.log('【A 函数的致命缺陷：顺序不敏感】');
for (const w of ['abc', 'cba', 'bca']) {
  console.log(`  hashSum("${w}") = ${hashSum(w)}`);
}
console.log('  三个不同的词算出同一个值 —— 如果这是你缓存的键，就会互相覆盖。');

// ---------------------------------------------------------------------------
// 3. 手写完整 HashTable（链地址法）
// ---------------------------------------------------------------------------

console.log('\n--- 3. 手写 HashTable：链地址法完整实现 ---');

/**
 * 链地址法哈希表
 *
 * 每个桶是一个数组，里面存 [key, value] 数对。
 * 撞进同一个桶的键值对就往后追加，形成一个"链"。
 *
 * 查找：算出桶下标 → 在该桶的链上线性扫描找 key。
 *       链的平均长度是负载因子 α，所以平均查找代价是 O(1 + α)。
 *
 * 这里把扩容阈值设为 0.75（工业界最常用的值）。
 */
class HashTable {
  constructor(initialCapacity = 8) {
    this.capacity = nextPrime(initialCapacity); // 桶数量取质数
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.size = 0;
    this.resizeCount = 0; // 扩容次数，用于观察 rehash 过程
    this.totalProbes = 0; // 累计探测次数，用于观察"访问一个元素要走多少步"
  }

  /** 哈希函数：djb2 + 转成字符串统一处理 */
  hash(key) {
    return hashDjb2(String(key)) % this.capacity;
  }

  get loadFactor() {
    return this.size / this.capacity;
  }

  /** 存入键值对，键已存在则更新。平均 O(1) */
  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value; // 键已存在 → 更新
        this.totalProbes += i + 1;
        return this;
      }
    }
    bucket.push([key, value]); // 新键 → 追加到链尾
    this.size += 1;
    this.totalProbes += bucket.length;

    // 负载因子超阈值 → 扩容
    if (this.loadFactor > 0.75) this.resize(this.capacity * 2);
    return this;
  }

  /** 取值，找不到返回 undefined。平均 O(1) */
  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        this.totalProbes += i + 1;
        return bucket[i][1];
      }
    }
    this.totalProbes += bucket.length;
    return undefined;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  /**
   * 删除。链地址法的删除很简单：把那条链上的元素摘掉即可。
   * （对比第 4 节的开放寻址法，那里删除要处理"墓碑"问题。）
   */
  delete(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.size -= 1;
        return true;
      }
    }
    return false;
  }

  /**
   * 扩容 + rehash：新建一个更大的桶数组，把【所有】元素重新算一遍哈希放进去。
   *
   * 为什么必须重新算、不能直接拷贝？
   *   因为桶下标 = hash % capacity，capacity 变了，下标就变了。
   *   比如原来 capacity=5、hash=7 → 下标 2；改成 capacity=11 后 → 下标 7。
   *
   * 复杂度：一次 rehash 是 O(n)。但因为容量翻倍，要经过 n 次插入才会触发一次，
   *         所以均摊到每次插入上仍是 O(1)（和 01 文件里动态数组扩容是同一个道理）。
   */
  resize(newCapacity) {
    const oldBuckets = this.buckets;
    const oldCapacity = this.capacity;
    this.capacity = nextPrime(newCapacity);
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
    this.size = 0;
    // 把老元素逐个重新插入
    for (const bucket of oldBuckets) {
      for (const [k, v] of bucket) {
        this.set(k, v); // 注意：这里会走到下面那个 if，可能再次触发扩容
        // 但因为我们在扩容前已经把 capacity 设大了，通常不会递归扩容
      }
    }
    this.resizeCount += 1;
    return { from: oldCapacity, to: this.capacity };
  }

  keys() {
    const out = [];
    for (const bucket of this.buckets) for (const [k] of bucket) out.push(k);
    return out;
  }

  /** 打印桶分布，用于直观看到"数据是怎么散的" */
  bucketsSnapshot(limit = 8) {
    const lines = [];
    for (let i = 0; i < Math.min(this.capacity, limit); i++) {
      const bucket = this.buckets[i];
      const content = bucket.map(([k, v]) => `${k}=${v}`).join(' -> ');
      lines.push(`    桶[${String(i).padStart(2)}] ${bucket.length === 0 ? '(空)' : content}`);
    }
    if (this.capacity > limit) lines.push(`    ...（共 ${this.capacity} 个桶，只显示前 ${limit} 个）`);
    return lines.join('\n');
  }

  /** 最长的链有多长 —— 这个数字决定最坏情况下的查找代价 */
  stats() {
    let maxChain = 0;
    let emptyBuckets = 0;
    for (const b of this.buckets) {
      if (b.length === 0) emptyBuckets += 1;
      if (b.length > maxChain) maxChain = b.length;
    }
    return {
      capacity: this.capacity,
      size: this.size,
      loadFactor: this.loadFactor,
      maxChain,
      emptyBuckets,
      avgChain: this.size / this.capacity,
    };
  }
}

const ht = new HashTable(8);
console.log('');
console.log(`【初始状态】容量=${ht.capacity}（质数）  size=${ht.size}  负载因子=${ht.loadFactor.toFixed(2)}`);
console.log(ht.bucketsSnapshot(8));

console.log('');
console.log('【set("apple", 3)】【set("banana", 7)】【set("cherry", 5)】');
console.log('  操作前：size=' + ht.size);
ht.set('apple', 3).set('banana', 7).set('cherry', 5);
console.log('  操作后：size=' + ht.size + `  负载因子=${ht.loadFactor.toFixed(2)}`);
console.log(ht.bucketsSnapshot(8));

console.log('');
console.log('【get("banana")】查找过程：算哈希 → 定位桶 → 在链上比对');
const getResult = ht.get('banana');
console.log(`  hash("banana") % ${ht.capacity} = ${ht.hash('banana')}  → 桶[${ht.hash('banana')}]`);
console.log('  当前桶内容：' + JSON.stringify(ht.buckets[ht.hash('banana')]));
console.log(`  在链上找到 "banana" → 返回 ${getResult}`);

console.log('');
console.log('【set("apple", 99)】键已存在 → 覆盖而不是新增');
console.log('  操作前：size=' + ht.size + '，apple=' + ht.get('apple'));
ht.set('apple', 99);
console.log('  操作后：size=' + ht.size + '，apple=' + ht.get('apple'));
console.log('  注意 size 没有变 —— 哈希表的键是唯一的。');

console.log('');
console.log('【get("durian")】查找一个不存在的键');
console.log(`  get("durian") = ${ht.get('durian')}`);
console.log(`  hash("durian") % ${ht.capacity} = ${ht.hash('durian')}，桶[${ht.hash('durian')}] 是 ${JSON.stringify(ht.buckets[ht.hash('durian')])}`);
console.log('  桶是空的 → 一次比对都不用做，直接返回 undefined。这就是 O(1) 的样子。');

console.log('');
console.log('【delete("banana")】删除');
console.log('  操作前：size=' + ht.size + `，has("banana")=${ht.has('banana')}`);
ht.delete('banana');
console.log('  操作后：size=' + ht.size + `，has("banana")=${ht.has('banana')}`);

// ---------------------------------------------------------------------------
// 4. 冲突解决之二：开放寻址法（线性探测）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 冲突解决之二：开放寻址法（线性探测）---');
console.log('');
console.log('链地址法用"链表"装下冲突的元素；开放寻址法换了个思路：');
console.log('  【所有元素都存在桶数组本身里】，撞了就往后找下一个空位。');
console.log('');
console.log('  插入 "apple"（hash%8=2），位置空着 → 直接放桶[2]');
console.log('    [ _ ][ _ ][apple][ _ ][ _ ][ _ ][ _ ][ _ ]');
console.log('');
console.log('  插入 "dog"（hash%8=2，也撞了）→ 从 2 开始往后找，桶[3] 空 → 放进去');
console.log('    [ _ ][ _ ][apple][ dog ][ _ ][ _ ][ _ ][ _ ]');
console.log('                      ↑ 探测了 2、3 两个位置');
console.log('');
console.log('  查找 "dog"：算出来是 2，但桶[2] 是 apple ≠ dog，');
console.log('              于是【按同样的顺序往后探测】：桶[3] 是 dog，找到！');
console.log('');
console.log('  这就是开放寻址法的铁律：查找必须复现插入时的探测序列。');
console.log('  由此推出两个重要后果：');
console.log('    ① 删除不能直接把槽位置空 —— 那会截断探测链，');
console.log('       让后面本可以找到的元素永远找不到，必须留一个"墓碑"(tombstone)标记；');
console.log('    ② 负载因子不能接近 1 —— 越满越容易连成一片"聚集"(clustering)，');
console.log('       探测步数会爆炸式增长。');

/** 开放寻址法哈希表（线性探测 + 墓碑删除） */
class OpenAddressingHashTable {
  constructor(capacity = 8) {
    this.capacity = nextPrime(capacity);
    this.keys = new Array(this.capacity).fill(undefined);
    this.values = new Array(this.capacity).fill(undefined);
    this.TOMBSTONE = Symbol('tombstone'); // 墓碑：标记"这里曾有元素，被删了"
    this.size = 0;
    this.usedSlots = 0; // 已占用的槽位（含墓碑），用来决定何时真正扩容
    this.probeLog = []; // 记录每次操作的探测步数
  }

  hash(key) {
    return hashDjb2(String(key)) % this.capacity;
  }

  set(key, value) {
    let idx = this.hash(key);
    let probes = 0;
    let firstTombstone = -1;
    while (true) {
      probes += 1;
      const slot = this.keys[idx];
      if (slot === undefined) {
        // 找到空位：如果之前路过墓碑就复用墓碑位置，否则用当前空位
        const target = firstTombstone !== -1 ? firstTombstone : idx;
        if (firstTombstone !== -1) {
          this.keys[firstTombstone] = key;
          this.values[firstTombstone] = value;
        } else {
          this.keys[target] = key;
          this.values[target] = value;
          this.usedSlots += 1;
        }
        this.size += 1;
        this.probeLog.push(probes);
        break;
      }
      if (slot === key) {
        // 键已存在 → 覆盖
        this.values[idx] = value;
        this.probeLog.push(probes);
        break;
      }
      if (slot === this.TOMBSTONE && firstTombstone === -1) firstTombstone = idx;
      idx = (idx + 1) % this.capacity; // 线性探测：往后走一格，绕圈
      if (probes > this.capacity) throw new Error('表已满，无法插入');
    }
    if (this.usedSlots / this.capacity > 0.7) this.resize(this.capacity * 2);
    return this;
  }

  get(key) {
    let idx = this.hash(key);
    let probes = 0;
    while (true) {
      probes += 1;
      const slot = this.keys[idx];
      if (slot === undefined) {
        this.probeLog.push(probes);
        return undefined; // 遇到真正的空位 → 说明这个键一定不存在（探测链到此为止）
      }
      if (slot === key) {
        this.probeLog.push(probes);
        return this.values[idx];
      }
      // 墓碑要跳过继续找，不能在这里停下
      idx = (idx + 1) % this.capacity;
      if (probes > this.capacity) {
        this.probeLog.push(probes);
        return undefined;
      }
    }
  }

  /** 删除：放墓碑，而不是置空 */
  delete(key) {
    let idx = this.hash(key);
    let probes = 0;
    while (true) {
      probes += 1;
      const slot = this.keys[idx];
      if (slot === undefined) return false;
      if (slot === key) {
        this.keys[idx] = this.TOMBSTONE; // ← 关键：放墓碑
        this.values[idx] = undefined;
        this.size -= 1;
        return true;
      }
      idx = (idx + 1) % this.capacity;
      if (probes > this.capacity) return false;
    }
  }

  /** 清掉墓碑后重新插入所有元素（真实实现里会这样做来回收空间） */
  resize(newCapacity) {
    const oldKeys = this.keys;
    const oldValues = this.values;
    this.capacity = nextPrime(newCapacity);
    this.keys = new Array(this.capacity).fill(undefined);
    this.values = new Array(this.capacity).fill(undefined);
    this.size = 0;
    this.usedSlots = 0;
    for (let i = 0; i < oldKeys.length; i++) {
      if (oldKeys[i] !== undefined && oldKeys[i] !== this.TOMBSTONE) {
        this.set(oldKeys[i], oldValues[i]);
      }
    }
    // rehash 之后所有墓碑都被清掉了
    this.usedSlots = this.size;
    return this;
  }

  snapshot() {
    return (
      '  ' +
      this.keys
        .map((k) => {
          if (k === undefined) return '[ __ ]';
          if (k === this.TOMBSTONE) return '[墓碑]';
          return `[${String(k).slice(0, 4).padEnd(4)}]`;
        })
        .join('')
    );
  }
}

const oa = new OpenAddressingHashTable(8);
console.log('');
console.log(`【初始状态】容量=${oa.capacity}`);
console.log(oa.snapshot());

console.log('');
console.log('【依次 set("a",1) set("b",2) set("c",3) set("d",4)】');
console.log('  操作前：size=' + oa.size);
console.log(oa.snapshot());
for (const [k, v] of [
  ['a', 1],
  ['b', 2],
  ['c', 3],
  ['d', 4],
]) {
  oa.set(k, v);
  const lastProbe = oa.probeLog[oa.probeLog.length - 1];
  console.log(`  set("${k}", ${v}) → 桶[${oa.hash(k)}]${lastProbe > 1 ? ` 撞了，探测 ${lastProbe} 步` : ' 一次命中'}`);
  console.log(oa.snapshot());
}
console.log('  操作后：size=' + oa.size + `  负载因子≈${(oa.size / oa.capacity).toFixed(2)}`);

console.log('');
console.log('【get("c")】查找会复现插入时的探测路径');
const oaGet = oa.get('c');
console.log(`  hash("c") % ${oa.capacity} = ${oa.hash('c')} → 从桶[${oa.hash('c')}] 开始往后探测`);
console.log(`  探测了 ${oa.probeLog[oa.probeLog.length - 1]} 步，返回 ${oaGet}`);

console.log('');
console.log('【delete("b")】删除 → 放墓碑而不是置空');
console.log('  操作前：' + oa.snapshot());
oa.delete('b');
console.log('  操作后：' + oa.snapshot());
console.log('  看到那个 [墓碑] 了吗？如果直接置空，');
console.log('  "c" 的探测链就会在这里断掉，get("c") 会错误地返回 undefined。');
console.log(`  验证：删除 "b" 之后，get("c") = ${oa.get('c')}（仍然能找到，墓碑机制生效）`);

console.log('');
console.log('【插入足够多的元素，触发 rehash（顺便回收墓碑）】');
console.log('  操作前：size=' + oa.size + `  容量=${oa.capacity}`);
for (let i = 0; i < 12; i++) oa.set(`k${i}`, i);
console.log('  操作后：size=' + oa.size + `  容量=${oa.capacity}（已扩容，墓碑被清空）`);
console.log(oa.snapshot());

console.log('');
console.log('两种策略对比：');
console.log('');
console.log('对比项'.padEnd(24) + '链地址法'.padEnd(34) + '开放寻址法');
console.log('-'.repeat(100));
for (const [item, chaining, open] of [
  ['元素存放位置', '桶里挂链表，元素在链表节点上', '元素直接存在桶数组里'],
  ['负载因子上限', '可以 > 1（链可以无限长）', '必须 < 1，通常 0.7 左右就扩容'],
  ['删除操作', '直接摘链，简单', '必须放墓碑，否则截断探测链'],
  ['内存局部性', '差（链表节点分散在堆上）', '好（数据都在一个连续数组里）'],
  ['额外内存开销', '每个元素一个节点 + 一个指针', '几乎为零（只有一个数组）'],
  ['最怕什么', '哈希函数差 → 链很长', '负载因子高 → 聚集严重，探测步数爆炸'],
  ['典型使用者', 'Java HashMap、JS 引擎的对象', 'Python dict、Rust HashMap、Google 的 SwissTable'],
]) {
  console.log(item.padEnd(22) + chaining.padEnd(34) + open);
}

// ---------------------------------------------------------------------------
// 5. 负载因子与扩容（rehash）全过程
// ---------------------------------------------------------------------------

console.log('\n--- 5. 负载因子与扩容：观察 rehash 全过程 ---');
console.log('');
console.log('负载因子 α = 已存元素数 / 桶数量。它直接决定平均链长，也就决定了查找速度：');
console.log('  链地址法：平均查找代价 ≈ 1 + α');
console.log('  开放寻址法：平均查找代价 ≈ 1 / (1 - α)，α 靠近 1 时会"爆炸"');
console.log('');
console.log('  α'.padEnd(10) + '链地址法平均步数'.padEnd(20) + '开放寻址法平均步数');
console.log('  ' + '-'.repeat(52));
for (const alpha of [0.1, 0.25, 0.5, 0.75, 0.9, 0.99]) {
  console.log(
    '  ' +
      String(alpha).padEnd(10) +
      (1 + alpha).toFixed(2).padEnd(20) +
      (1 / (1 - alpha)).toFixed(2),
  );
}
console.log('  所以 α=0.75 是个甜点：链地址法平均 1.75 步，开放寻址法平均 4 步，都还能接受；');
console.log('  再往上收益骤减，所以工业界普遍在 0.75 附近触发扩容。');

console.log('');
console.log('实测扩容过程（插入 60 个元素，每次扩容都打印出来）：');
console.log('');
const growHt = new HashTable(4);
console.log('  插入进度'.padEnd(14) + '容量'.padEnd(10) + 'size'.padEnd(10) + '负载因子'.padEnd(12) + '最长链'.padEnd(10) + '事件');
console.log('  ' + '-'.repeat(78));

let lastResizeCount = 0;
for (let i = 1; i <= 60; i++) {
  const before = growHt.capacity;
  growHt.set(`k${i}`, i);
  const st = growHt.stats();
  const resized = growHt.capacity !== before;
  // 只在扩容发生时打印，避免刷屏
  if (resized || i <= 1) {
    console.log(
      '  ' +
        `第 ${i} 次插入`.padEnd(14) +
        String(st.capacity).padEnd(10) +
        String(st.size).padEnd(10) +
        st.loadFactor.toFixed(2).padEnd(12) +
        String(st.maxChain).padEnd(10) +
        (resized ? `★ 扩容 ${before} → ${st.capacity}，全部元素重新哈希` : '初始状态'),
    );
  }
}
lastResizeCount = growHt.resizeCount;

const growStats = growHt.stats();
console.log('');
console.log(`最终状态：容量=${growStats.capacity}，size=${growStats.size}，` +
  `负载因子=${growStats.loadFactor.toFixed(2)}，最长链=${growStats.maxChain}，空桶=${growStats.emptyBuckets}`);
console.log(`整个过程中一共扩容了 ${lastResizeCount} 次。`);
console.log('');
console.log('注意两点：');
console.log('  ① 扩容后负载因子会掉到 0.5 以下 —— 这是为后续插入预留的空间；');
console.log('  ② 最长链基本维持在 1~3 之间，这说明 djb2 + 质数桶数量的组合分布均匀。');
console.log('     如果最长链一直很大，说明哈希函数或桶数量选得不好。');

const finalDist = growHt.stats();
console.log('');
console.log(`桶分布（前 12 个，容量 ${finalDist.capacity}）：`);
console.log(growHt.bucketsSnapshot(12));

// ---------------------------------------------------------------------------
// 6. 实测：手写 HashTable vs 原生 Map
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实测：手写 HashTable vs 原生 Map ---');

const N = 20000;
const keys = [];
for (let i = 0; i < N; i++) keys.push(`user_${i}`);

// 6.1 插入
const mapInsertMs = medianMs(() => {
  const m = new Map();
  for (let i = 0; i < N; i++) m.set(keys[i], i);
  sink.value = m.size;
});

const htInsertMs = medianMs(() => {
  const h = new HashTable(16);
  for (let i = 0; i < N; i++) h.set(keys[i], i);
  sink.value = h.size;
});

// 6.2 查找（全部命中）
const map = new Map();
const ht2 = new HashTable(16);
for (let i = 0; i < N; i++) {
  map.set(keys[i], i);
  ht2.set(keys[i], i);
}

const mapGetMs = medianMs(() => {
  let acc = 0;
  for (let i = 0; i < N; i++) acc += map.get(keys[i]);
  sink.value = acc;
});

const htGetMs = medianMs(() => {
  let acc = 0;
  for (let i = 0; i < N; i++) acc += ht2.get(keys[i]);
  sink.value = acc;
});

// 6.3 查找（全部未命中）
const missKeys = keys.map((k) => k + '_missing');
const mapMissMs = medianMs(() => {
  let acc = 0;
  for (let i = 0; i < N; i++) if (map.get(missKeys[i]) === undefined) acc += 1;
  sink.value = acc;
});
const htMissMs = medianMs(() => {
  let acc = 0;
  for (let i = 0; i < N; i++) if (ht2.get(missKeys[i]) === undefined) acc += 1;
  sink.value = acc;
});

console.log('');
console.log(`规模 n = ${N} 个字符串键：`);
console.log('');
console.log('操作'.padEnd(26) + '原生 Map(ms)'.padEnd(16) + '手写 HashTable(ms)'.padEnd(20) + '倍数');
console.log('-'.repeat(80));
const rows = [
  ['插入 n 次', mapInsertMs, htInsertMs],
  ['查找 n 次（全命中）', mapGetMs, htGetMs],
  ['查找 n 次（全未命中）', mapMissMs, htMissMs],
];
for (const [label, m, h] of rows) {
  console.log(
    label.padEnd(24) + m.toFixed(4).padEnd(16) + h.toFixed(4).padEnd(20) + `${(h / m).toFixed(2)}x`,
  );
}
console.log('');
console.log('为什么原生 Map 更快？');
console.log('  · Map 是 C++ 实现的，桶数组用的是连续内存 + 内联存储，没有 JS 对象/数组的开销；');
console.log('  · 我们的手写版每个桶是一个 JS 数组，每个元素是一个 [key, value] 数组，');
console.log('    每次读写都要经过多层对象属性访问，常数因子大得多；');
console.log('  · Map 的哈希也是引擎优化的（对字符串有缓存），我们每次都要重算 djb2。');
console.log('');
console.log('但这【不】意味着手写哈希表没意义：');
console.log('  · 复杂度是同一档的（都是平均 O(1)），差距只在常数因子；');
console.log('  · 自己写一遍是为了理解 rehash、冲突、负载因子这些必须懂的概念；');
console.log('  · 真正写业务代码时，永远优先用语言内置的 Map / Set / 对象。');

console.log('');
console.log(`手写 HashTable 的内部统计：容量=${ht2.stats().capacity}，负载因子=${ht2.stats().loadFactor.toFixed(2)}，` +
  `最长链=${ht2.stats().maxChain}，扩容次数=${ht2.resizeCount}`);
console.log(`累计探测步数=${ht2.totalProbes}，平均每次操作 ${(ht2.totalProbes / (N * 2)).toFixed(2)} 步 —— ` +
  '这就是"平均 O(1)"的实证：不管表里有多少元素，平均只走一两步。');

// ---------------------------------------------------------------------------
// 7. 最坏情况 O(n) 与哈希碰撞攻击
// ---------------------------------------------------------------------------

console.log('\n--- 7. 最坏情况 O(n)：哈希碰撞攻击（HashDoS）---');
console.log('');
console.log('哈希表的 O(1) 有两个前提：哈希函数均匀 + 攻击者无法预测。');
console.log('如果哈希函数可预测、又没有随机化，攻击者就能【故意】构造大量冲突的 key。');
console.log('');
console.log('演示：用一个"只用字符串长度"的坏哈希函数，构造 2000 个长度相同的 key。');

/** 用指定哈希函数构造一张表，返回统计信息 */
function buildTableWithHash(hashFnImpl, keyList, bucketCount) {
  const buckets = new Array(bucketCount).fill(null).map(() => []);
  for (const k of keyList) {
    const idx = hashFnImpl(k) % bucketCount;
    buckets[idx].push(k);
  }
  let maxChain = 0;
  let empty = 0;
  for (const b of buckets) {
    if (b.length === 0) empty += 1;
    if (b.length > maxChain) maxChain = b.length;
  }
  return { maxChain, empty, avg: keyList.length / bucketCount };
}

// 攻击者的输入：全部是 6 个字符的 key（长度一样）
const attackKeys = [];
for (let i = 0; i < 2000; i++) attackKeys.push(`k${String(i).padStart(5, '0')}`); // 长度都是 6

// 正常用户的输入：长度参差
const normalKeys = [];
let s = 12345;
for (let i = 0; i < 2000; i++) {
  s = (s * 48271) % 2147483647;
  normalKeys.push(`u${'x'.repeat(s % 12)}${i}`); // 长度在 2~13 之间
}

const BC = nextPrime(2000);
console.log('');
console.log(`桶数量 = ${BC}（质数），每组 2000 个 key。对比两种哈希函数在两种输入下的表现：`);
console.log('');
console.log('哈希函数'.padEnd(28) + '输入'.padEnd(16) + '最长链'.padEnd(10) + '查找最坏代价');
console.log('-'.repeat(78));
for (const [hname, hfn] of [
  ['长度哈希（无随机化）', hashLength],
  ['djb2（好哈希）', hashDjb2],
]) {
  for (const [kname, klist] of [
    ['正常用户数据', normalKeys],
    ['攻击者构造数据', attackKeys],
  ]) {
    const r = buildTableWithHash(hfn, klist, BC);
    console.log(
      hname.padEnd(26) + kname.padEnd(14) + String(r.maxChain).padEnd(10) + `O(${r.maxChain})`,
    );
  }
}

console.log('');
console.log('看懂这张表：');
console.log(`  · 用"长度哈希"处理攻击者的数据时，全部 2000 个 key 挤进了极少数桶，`);
console.log('    最长链达到四位数 —— 每次查找要在线性链上扫过上千个元素，');
console.log('    O(1) 彻底退化成 O(n)，CPU 就这么被打满了；');
console.log('  · 换成 djb2 之后，两种输入下最长链都降回个位数 —— 好哈希对输入分布不敏感；');
console.log('  · 注意"长度哈希"处理【正常数据】时最长链也有 184，同样很糟。');
console.log('    这说明坏哈希函数的问题不是"只在被攻击时才出现"，而是本来就慢，');
console.log('    只是被攻击时它从"慢"变成"彻底不可用"。');
console.log('  · 最后一行尤其值得记住：好哈希面对攻击者构造的数据（长度全都一样）');
console.log('    依然保持个位数的最长链 —— 这正是一个合格哈希函数应有的"抗操纵性"。');

console.log('');
console.log('真实世界的防御手段：');
console.log('  1. 加盐 / 随机种子：哈希函数里混入一个进程启动时随机生成的种子，');
console.log('     攻击者无法离线构造出必然冲突的 key（这叫做 SipHash、或"哈希随机化"）；');
console.log('  2. 限制请求体大小和键的数量：从根本上减少可碰撞的元素规模；');
console.log('  3. 退化保护：某些实现会在链过长时把该桶转成红黑树，');
console.log('     最坏代价从 O(n) 降到 O(log n)（Java 8 的 HashMap 就是这么做的）。');
console.log('');
console.log('历史上著名的事件：2011 年多个语言的 Web 框架被 HashDoS 打瘫，');
console.log('包括 PHP、Java、Python、Ruby、Node.js 生态，之后各大语言都陆续加了哈希随机化。');
console.log('这正是"理论上的最坏情况"变成"现实中的安全事故"的经典案例。');

// ---------------------------------------------------------------------------
// 8. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 8. 复杂度对照表 ---');

const complexity = [
  ['哈希表 插入 set', 'O(1) 均摊', 'O(n)', '平均常数步；最坏是全部撞进同一个桶'],
  ['哈希表 查找 get', 'O(1)', 'O(n)', '平均探测 1+α 步；α 是负载因子'],
  ['哈希表 删除 delete', 'O(1)', 'O(n)', '链地址法直接摘链；开放寻址法要放墓碑'],
  ['哈希表 扩容 rehash', 'O(n)', 'O(n)', '单次一定是 O(n)；均摊到每次插入才是 O(1)'],
  ['遍历所有键', 'O(n + capacity)', 'O(n + capacity)', '要扫过所有桶（含空桶），所以桶太多也费时'],
  ['计算一次哈希', 'O(L)', 'O(L)', 'L 是 key 的长度；字符串必须逐字符算'],
  ['数组 线性查找', 'O(n)', 'O(n)', '无序时只能一个个比，平均看一半、最坏看全部'],
  ['有序数组 二分查找', 'O(log n)', 'O(log n)', '前提是已排序；插入要 O(n) 维护有序性'],
  ['平衡二叉搜索树 查找', 'O(log n)', 'O(log n)', '"平衡"是关键；失衡会退化成链表 O(n)'],
];

console.log('操作'.padEnd(30) + '平均'.padEnd(18) + '最坏'.padEnd(12) + '说明');
console.log('-'.repeat(100));
for (const [op, avg, worst, note] of complexity) {
  console.log(op.padEnd(28) + avg.padEnd(18) + worst.padEnd(12) + note);
}

console.log('');
console.log('什么时候用哈希表、什么时候不用：');
console.log('  ✓ 用：等值查找、去重、计数、缓存 —— 键的集合是"无序但唯一"的；');
console.log('  ✗ 不用：需要范围查询（找 18~30 岁的用户）→ 用平衡树 / B+ 树；');
console.log('  ✗ 不用：需要有序遍历 → 用平衡树或排序数组；');
console.log('  ✗ 不用：需要"最接近的键"→ 哈希表的哈希值毫无大小意义；');
console.log('  ✗ 不用：数据量很小（十几个）→ 数组线性扫描更快，常数因子小得多。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}，手写表累计探测 ${ht2.totalProbes} 步）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
