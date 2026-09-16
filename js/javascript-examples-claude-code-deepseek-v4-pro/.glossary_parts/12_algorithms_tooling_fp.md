## 算法与数据结构

### Algorithm（算法）

算法是「把输入变成输出的一串明确步骤」，严格的算法定义要求五个性质：输入、输出、有穷性（有限步内终止）、确定性（同样的输入得到同样的输出）、可行性（每一步都真的能做到）。同一个问题通常有多个算法，它们的差别往往不在「对不对」，而在**代价**——这正是复杂度分析存在的理由。工程实践里，「选算法」与「选数据结构」几乎总是同一个决策的两面：说「用哈希表做」时，算法其实也一起定了。

**常见误解**：以为算法只存在于面试题里。真实项目里「去重」「分页」「求交集」「按依赖排序」都是算法选择问题，选错一次就可能是线上接口从 20ms 变成 8 秒。

也见 [Data Structure（数据结构）](#data-structure数据结构)、[Time Complexity（时间复杂度）](#time-complexity时间复杂度)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Data Structure（数据结构）

数据结构是「数据在内存里如何组织」，它决定了每种操作的代价：数组按下标访问是 O(1) 但中间插入是 O(n)，链表插入是 O(1) 但要找位置是 O(n)，哈希表平均 O(1) 但无序。**没有万能的数据结构**，只有「针对当前操作组合最划算」的那一个。选择的基本方法是：先列出业务里最高频的操作（查？插？删？排序？按范围取？），再看哪种结构把这些操作做得最便宜。

**常见误解**：把数据结构等同于「课本上的链表、树、图」。语言内置的 `Array`、`Map`、`Set`、`Object`、`TypedArray` 同样是数据结构，而且绝大多数场景直接用它们就够了。

也见 [Array（数组）](#array数组)、[Hash Table（哈希表）](#hash-table哈希表)。

示例：[`38_algorithms_and_data_structures/02_linked_list.js`](38_algorithms_and_data_structures/02_linked_list.js)、[`23_collections/07_map_vs_object.js`](23_collections/07_map_vs_object.js)

### Time Complexity（时间复杂度）

时间复杂度描述的是「运行时间随输入规模 n 增长的趋势」，而不是具体的毫秒数。它把每一步操作视为等价的「一次基本操作」，然后数出总共做了多少次，例如：单层循环访问 n 个元素是 O(n)，双重循环两两比较是 O(n²)，每次砍一半是 O(log n)。关键价值在于**预测**：n 从 100 涨到 100 万时，O(n²) 会慢一万倍，而 O(n log n) 只慢约两万分之一的比例——这是本地小数据测不出来的。

**常见误解**：拿「本地跑 100 条数据很快」当结论。复杂度的坑只在数据量变大时才暴露，所以必须按「未来的数据规模」而不是「今天的数据规模」来选。

也见 [Space Complexity（空间复杂度）](#space-complexity空间复杂度)、[Big-O Notation（大O表示法）](#big-o-notation大o表示法)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Space Complexity（空间复杂度）

空间复杂度描述算法「额外」占用的内存随 n 的增长趋势，注意关键词是**额外**——输入本身占的空间不计入，只算算法自己申请的那部分（临时数组、递归栈、哈希表、缓存）。常见档位：原地交换是 O(1)，归并排序需要一个 O(n) 的辅助数组，朴素递归的调用栈是 O(n)，而 DP 的完整二维表可能是 O(n²)。一个非常实用的技巧是「用时间换空间」或反过来：DP 里只保留上一行就能把 O(n²) 空间压到 O(n)。

**常见误解**：以为空间复杂度不重要。在移动端、嵌入式、以及需要处理千万级数据的 Node 服务里，内存往往比 CPU 更先成为瓶颈。

也见 [In-place Sort（原地排序）](#in-place-sort原地排序)、[Time Complexity（时间复杂度）](#time-complexity时间复杂度)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Big-O Notation（大O表示法）

大 O 记号描述的是增长趋势的**上界**，写作 O(f(n))，读作「增长不快于 f(n) 的量级」。它有三条约定：只保留最高阶项（3n² + 100n + 5000 → O(n²)），忽略常数因子（2n 和 100n 都是 O(n)），并且通常要指明是最好/最坏/平均哪种情况。之所以能这么「粗暴」地丢弃细节，是因为当 n 足够大时，最高阶项会彻底压过其余一切。

**常见误解**：把大 O 当成性能测量的替代品。它只比较**趋势**，不比较**绝对速度**：n 很小时 O(n²) 的算法完全可能比 O(n log n) 更快，因为后者的常数因子更大。

也见 [Big-Θ and Big-Ω（大Θ与大Ω）](#big-θ-and-big-ω大θ与大ω)、[Constant Factor（常数因子）](#constant-factor常数因子)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Big-Θ and Big-Ω（大Θ与大Ω）

大 O 只给上界，因此不够精确：严格来说「二分查找是 O(n²)」这句话也是对的（因为它不会比 n² 更慢），只是毫无信息量。**大 Ω（Big-Omega）**给的是下界：Ω(f(n)) 表示「至少要花这么多」，例如任何基于比较的排序都是 Ω(n log n)。**大 Θ（Big-Theta）**给的是紧确界：Θ(f(n)) 表示上界和下界都是 f(n)，即「增长量级正好是它」。工程口语里说的「这是 O(n log n) 的算法」，实际想表达的是 Θ(n log n)。

**常见误解**：把 O 和 Θ 当同义词。面试和文档里普遍混用，但当你需要说「这个算法不可能更快」时，只有 Ω / Θ 能表达这层意思。

也见 [Big-O Notation（大O表示法）](#big-o-notation大o表示法)、[Growth Rate（增长率）](#growth-rate增长率)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Growth Rate（增长率）

增长率是复杂度分析的真正主题：不是「跑多久」，而是「n 翻倍时慢几倍」。对照表非常直观——O(1) 不变；O(log n) 只多一点点（n 翻倍只多 1 次比较）；O(n) 慢一倍；O(n log n) 略多于一倍；O(n²) 慢四倍；O(2ⁿ) 直接翻倍到无法承受。跨量级之间的差距会随 n 放大到荒谬的程度：n = 100 万时，O(n log n) 约两千万次操作，而 O(n²) 是一万亿次。

**常见误解**：只关注同一量级内的「谁快一点」。跨量级的优化（n² → n log n）永远优先于同量级内的微调。

也见 [Asymptotic Analysis（渐进分析）](#asymptotic-analysis渐进分析)、[Constant Factor（常数因子）](#constant-factor常数因子)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Constant Factor（常数因子）

常数因子是大 O 里被刻意忽略的那部分：循环体里做一次加法还是做一次字符串拼接，复杂度都写作 O(n)，但实际耗时可能差几十倍。它决定了两种「同量级」实现的真实胜负——例如同样是 O(n log n)，插入排序在小数组上常比快排快，所以标准库的快排会在子数组长度小于阈值时切换成插入排序。它也是为什么「用 `Map` 代替对象做频繁增删」这类优化值得做：量级不变，但常数因子变小。

**常见误解**：以为「复杂度一样所以随便选」。在 n 不大的常见业务场景里，常数因子往往就是决定性的那个因素。

也见 [Big-O Notation（大O表示法）](#big-o-notation大o表示法)、[Growth Rate（增长率）](#growth-rate增长率)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Asymptotic Analysis（渐进分析）

渐进分析是「让 n 趋于无穷大」来分析算法代价的方法，它是大 O、大 Θ、大 Ω 这些记号背后的统一框架。做法是：写出代价关于 n 的表达式，然后取 n → ∞ 的极限行为，只关心主导项。它之所以合理，是因为我们关心的是「规模继续增长时会不会崩」，而不是「今天这一千条数据要几毫秒」。渐进分析同时也是**忽略硬件**的分析：它假定每次基本操作代价相同，因此不同机器上得到的结论一致。

**常见误解**：把渐进结论直接当作性能结论。渐进分析是必要条件而不是充分条件，选型时还要回到真实的 n 与真实的常数因子。

也见 [Big-O Notation（大O表示法）](#big-o-notation大o表示法)、[Best-Worst-Average Case（最好最坏与平均情况）](#best-worst-average-case最好最坏与平均情况)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Best-Worst-Average Case（最好最坏与平均情况）

同一个算法在不同输入上代价可能差很多，所以要分三种情况讨论。以快速排序为例：**最好情况**是每次分区都正好对半分，O(n log n)；**最坏情况**是每次都选到当前最大或最小值（例如对已排序数组取首元素作 pivot），退化成 O(n²)；**平均情况**是在输入随机分布的假设下，期望为 O(n log n)。工程上有两条实践：报告性能时用**最坏情况**做安全边界，因为线上确实会有人传进已排序的数据；优化时关注**平均情况**，因为它决定日常体验。

**常见误解**：用「平均情况」掩盖最坏情况。哈希表平均 O(1) 但最坏 O(n)，攻击者可以刻意构造大量冲突的 key 把服务打垮（HashDoS），这正是很多语言给哈希函数加随机种子的原因。

也见 [Amortized Analysis（均摊分析）](#amortized-analysis均摊分析)、[Tree Degeneration（树的退化）](#tree-degeneration树的退化)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)、[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Amortized Analysis（均摊分析）

均摊分析算的是**一连串操作的平均代价**，而不是单次操作的最坏代价。最经典的例子是动态数组的 `push`：单次可能因为扩容而要复制整个数组（O(n)），但把 n 次 push 连起来看，总代价是 O(n)，因此**均摊**下来每次是 O(1)。推导的关键是「扩容按倍数而不是按固定量增长」——每次扩容后，前一次扩容的复制成本被后续 n 次廉价操作摊掉。理解它的意义在于避免误判：`push` 偶尔慢一次是正常的，不意味着实现有性能问题。

**常见误解**：把均摊复杂度当成平均复杂度。**均摊**是对「任意一串操作序列」的最坏总代价取平均，是确定性的保证；**平均**依赖输入的概率分布假设，两者完全不同。

也见 [Best-Worst-Average Case（最好最坏与平均情况）](#best-worst-average-case最好最坏与平均情况)、[Array（数组）](#array数组)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)、[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Array（数组）

数组是**连续内存 + 下标直接寻址**的线性结构，因此按下标读写是 O(1)，遍历对 CPU 缓存极其友好。代价在两端之外的位置：中间插入或删除需要把后面的元素整体搬移，O(n)。JS 的 `Array` 是动态数组（可自动扩容），并且因为历史原因可以是不连续的「稀疏数组」或混装任意类型——**混装类型会丢掉引擎的类型特化优化**，这是 JS 数组比 C 数组慢的主要原因之一。

**常见误解**：用 `arr.shift()` / `arr.unshift()` 做队列。它们要搬移整个数组，是 O(n)，循环里用会退化成 O(n²)——队列请用双端队列或头指针。

也见 [Linked List（链表）](#linked-list链表)、[Queue（队列）](#queue队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)、[`24_typed_arrays/01_arraybuffer_basics.js`](24_typed_arrays/01_arraybuffer_basics.js)

### Linked List（链表）

链表由一组**节点**串成，每个节点存「值」和「下一个节点在哪」（指针）。**单向链表**只有 `next`，只能从前往后走；**双向链表**同时有 `next` 和 `prev`，可以两头走，代价是每个节点多存一个指针。它的核心优势是「已知节点时」的 O(1) 插入与删除（改指针即可，不用搬移数据），核心劣势是**不支持随机访问**——想拿第 k 个必须从头走 k 步，O(n)。

**常见误解**：以为链表「比数组快」。链表每个节点都是独立对象，内存分散、缓存不友好，实际遍历通常**比数组慢好几倍**。链表真正的用武之地是「哈希表 + 双向链表」这种结构（如 LRU 缓存），需要频繁在中间摘除和移动节点。

也见 [Array（数组）](#array数组)、[Queue（队列）](#queue队列)。

示例：[`38_algorithms_and_data_structures/02_linked_list.js`](38_algorithms_and_data_structures/02_linked_list.js)

### Stack（栈）

栈是**后进先出（LIFO，Last In First Out）**的受限线性表：只能在「栈顶」一端进出，操作有 `push`（入栈）、`pop`（出栈）、`peek`（看栈顶，不弹出）。它是对「最近发生的事最相关」这类场景的自然建模。真实世界里到处都是栈：函数调用栈、撤销/重做、浏览器前进后退、括号匹配、深度优先搜索的待访问集合、表达式求值的操作符栈。用数组实现栈是完美的——`push`/`pop` 都在数组末尾，均摊 O(1)。

**常见误解**：以为栈是某种特殊库。数组只要只用末尾进出，它就是一个栈。

也见 [Queue（队列）](#queue队列)、[Deque（双端队列）](#deque双端队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Queue（队列）

队列是**先进先出（FIFO，First In First Out）**的受限线性表：一端进（队尾 `enqueue`），另一端出（队头 `dequeue`）。它建模的是「公平排队」——先来的先服务，天然适用于任务调度、消息队列、BFS 的待访问集合、请求限流、打印队列。实现上的关键是**不要用数组的 `shift()`**：`shift` 需要搬移所有元素，是 O(n)，在循环里就成了 O(n²)。正确做法是环形缓冲（用取模让下标绕回）或「头指针 + 定期压缩」，也可以用链表。

**常见误解**：`[1,2,3].shift()` 看起来很像出队，于是被大量误用。它语义上确实是出队，但代价是 O(n) 而不是 O(1)。

也见 [Stack（栈）](#stack栈)、[Deque（双端队列）](#deque双端队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Deque（双端队列）

双端队列（double-ended queue，读作 "deck"）是**两端都能进出**的线性结构，因此它是栈和队列的超集：只从一端进出就是栈，一端进另一端出就是队列。用**环形缓冲**（固定或可扩容的数组 + 头尾两个下标 + 取模回绕）实现，两端操作都是 O(1) 均摊。它是「滑动窗口」类问题的标配容器，也是实现任务窃取调度器的基础。

**常见误解**：以为 JS 有内置的 deque。标准库没有，但 `Array` 的 `push`/`pop` 在尾部是 O(1)，配合一个手动维护的头下标就能模拟——这也是示例采用的做法。

也见 [Queue（队列）](#queue队列)、[Sliding Window（滑动窗口）](#sliding-window滑动窗口)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Priority Queue（优先队列）

优先队列不是「先来先服务」，而是「**优先级最高的先出**」：每次出队的都是当前优先级最大的（或最小的）元素。它不保证整体有序，只保证能 O(log n) 拿到极值、O(log n) 插入新元素。标准实现就是二叉堆。真实场景：任务调度（高优先级任务插队）、Dijkstra 最短路、Top-K 大文件（只保留 K 个最大的）、事件模拟、限流器。

**常见误解**：以为优先队列 = 排序数组。排序数组取极值是 O(1) 但插入是 O(n)，堆是插入和取极值都 O(log n)——**堆是折中后的最优解**，代价是堆内部无序，不支持「查第 3 大」。

也见 [Heap（堆）](#heap堆)、[Binary Heap（二叉堆）](#binary-heap二叉堆)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Heap（堆）

堆是一棵满足**堆序性质**的完全二叉树：**最小堆**里每个父节点都 ≤ 它的孩子（根是最小值），**最大堆**反之（根是最大值）。注意堆序只约束父子之间，**兄弟之间没有任何约束**——这就是为什么堆只能快速拿极值，却不能快速查找任意元素。堆的三大操作：取极值 O(1)，插入 O(log n)，删除极值 O(log n)。

**常见误解**：把堆和「内存堆（heap memory）」混为一谈，两者唯一的共同点只是名字。另一个常见误解是以为堆是一种排好序的结构——它不是，堆里除了根以外，别的元素位置都没有排序含义。

也见 [Binary Heap（二叉堆）](#binary-heap二叉堆)、[Priority Queue（优先队列）](#priority-queue优先队列)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Binary Heap（二叉堆）

二叉堆是堆最常见的实现：一棵**完全二叉树**（除最后一层外全填满，最后一层靠左排列）。形状规整带来一个巨大的好处——**可以直接用数组存储，完全不需要指针**：下标 i 的左孩子是 `2i+1`，右孩子是 `2i+2`，父节点是 `Math.floor((i-1)/2)`。这意味着二叉堆既没有链表节点的内存开销，又有极好的缓存局部性，是优先队列的事实标准。

**常见误解**：以为必须手写二叉树节点类。数组表示不仅更简单，而且更快；只有在需要「修改任意元素的优先级」（需要额外存位置索引）时才需要额外簿记。

也见 [Heap（堆）](#heap堆)、[siftUp and siftDown（上浮与下沉）](#siftup-and-siftdown上浮与下沉)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### siftUp and siftDown（上浮与下沉）

这两个是维护堆序的**全部秘密**。**siftUp（上浮）**用于插入：把新元素放到数组末尾，然后不断和父节点比较，若违反堆序就交换，直到位置正确——最多走树高，O(log n)。**siftDown（下沉）**用于删除堆顶：把末尾元素搬到根，然后不断和「更小的那个孩子」比较并交换，直到位置正确——同样 O(log n)。注意细节：下沉时必须先挑出较小的孩子再比，否则可能把孩子中较大的那个换上来，破坏堆序。

**常见误解**：以为插入和删除会「整理整个堆」。它们只沿一条从根到叶的路径走，这正是 O(log n) 的来源。也见 [Binary Heap（二叉堆）](#binary-heap二叉堆)、[Heapify（建堆）](#heapify建堆)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Heapify（建堆）

Heapify 指「把一个无序数组原地整形成一个合法堆」。最直觉的做法是逐个插入（n 次 siftUp），复杂度 O(n log n)；但更好的做法是**从最后一个非叶节点开始，倒着对每个节点做一次 siftDown**，复杂度只要 **O(n)**。为什么更快？因为绝大多数节点都在底层，下沉距离很短，把所有节点的下沉距离加起来收敛到 2n 而不是 n log n。建堆是堆排序的第一步（建堆 O(n) + n 次取极值 O(n log n)）。

**常见误解**：以为建堆也是 O(n log n)。「自底向上的 siftDown 建堆」是 O(n)，这是一个经典的反直觉结论，也是均摊/求和式分析的漂亮案例。

也见 [siftUp and siftDown（上浮与下沉）](#siftup-and-siftdown上浮与下沉)、[Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Hash Table（哈希表）

哈希表（散列表）用「算一次哈希、直接跳到目标位置」的方式，把查找从 O(n) 降到**平均 O(1)**。它由两个部件组成：**哈希函数**（把 key 映射成一个整数，再对桶数量取模得到桶下标）和**冲突解决策略**（不同 key 落到同一个桶时怎么办）。插入、查找、删除都是「算下标 → 在桶里找」。它是工程上性价比最高的数据结构，JS 的 `Map`、`Set`、对象属性都是它的实现。

**常见误解**：以为哈希表是 O(1)——只有**平均**是 O(1)，最坏情况是 O(n)。而且哈希表**不保证顺序**，需要按插入顺序遍历请用 `Map`（它保证插入序）。

也见 [Hash Function（哈希函数）](#hash-function哈希函数)、[Hash Collision（哈希冲突）](#hash-collision哈希冲突)、[Load Factor（负载因子）](#load-factor负载因子)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Hash Function（哈希函数）

哈希函数把任意 key 转换成一个大整数，再由「对桶数量取模」映射到具体桶。一个好的哈希函数要满足：**确定性**（同一个 key 永远得到同一个值）、**均匀性**（不同 key 尽量分散到不同桶，避免堆积）、**高效**（计算本身必须是 O(key 长度)、够快）、**雪崩效应**（输入差一个字符，输出应当面目全非）。JS 里字符串没有内建哈希，手写时常采用 `hash = (hash * 31 + charCode) | 0` 这类多项式滚动哈希。

**常见误解**：以为哈希值是「唯一编号」。哈希值必然可能重复（鸽笼原理），哈希表之所以正确，靠的是**冲突解决策略**而不是哈希函数本身。

也见 [Hash Table（哈希表）](#hash-table哈希表)、[Hash Collision（哈希冲突）](#hash-collision哈希冲突)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Hash Collision（哈希冲突）

冲突是指两个不同的 key 算出了同一个桶下标。两种主流解决方式：**链地址法（separate chaining）**——每个桶挂一条链表（或数组），冲突的 key 追加到链上，实现简单、删除方便；**开放寻址法（open addressing）**——冲突时按固定探测序列（线性探测、二次探测、双重哈希）在表内找下一个空槽，缓存更友好、不用额外内存，但删除需要「墓碑标记」，且负载因子高时性能急剧劣化。

**常见误解**：以为好的哈希函数能消除冲突。冲突是数学上不可避免的，能优化的只是冲突的**分布**与**处理成本**。也见 [Hash Table（哈希表）](#hash-table哈希表)、[Load Factor（负载因子）](#load-factor负载因子)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Load Factor（负载因子）

负载因子 = 已存元素数 / 桶数量，衡量哈希表的「拥挤程度」。它直接决定性能：链地址法下平均每桶链长就是负载因子，所以负载因子 3 意味着查找平均要比较 3 次；开放寻址法下负载因子越接近 1，探测次数越爆炸式增长。因此实现会设一个**阈值**（典型 0.75），一旦超过就触发扩容。0.75 这个值是空间与时间之间的经验折中——为了省内存把阈值调到 0.95，性能会掉得比省下的内存划算得多。

**常见误解**：以为负载因子是「表的填充百分比越大越省内存就越好」。实际上超过阈值后每次操作的平均代价会显著上升，扩容是必须的。

也见 [Rehash（重哈希扩容）](#rehash重哈希扩容)、[Hash Table（哈希表）](#hash-table哈希表)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Rehash（重哈希扩容）

扩容就是「申请一个更大的桶数组（通常翻倍），把旧表里的每个元素重新计算下标并搬过去」。关键点是**必须重新算哈希下标**（因为桶数量变了，`hash % 新容量` 的结果不同），这个过程叫 rehash。它的代价是 O(n)，但因为是按倍数扩容，均摊到每次插入只有 O(1)——和动态数组扩容是同一个道理。

**常见误解**：以为扩容只是「复制数组」。如果忘了重新取模，元素就会落在错误的桶里，查找随即失效——这是手写哈希表最常见的 bug。

也见 [Load Factor（负载因子）](#load-factor负载因子)、[Amortized Analysis（均摊分析）](#amortized-analysis均摊分析)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Binary Search Tree（二叉搜索树）

二叉搜索树（BST）是一棵二叉树，且对**每一个**节点都满足：左子树全部节点的值 < 根 < 右子树全部节点的值。这条性质带来一个强推论：每比较一次就能砍掉一半候选范围，于是查找、插入、删除都是 O(树高)。**中序遍历**一棵 BST 会得到升序序列，这是它最常用的性质（也用来验证一棵树是不是合法 BST）。理想情况下树高是 log n，但取决于插入顺序。

**常见误解**：以为 BST 的查找总是 O(log n)。只有**平衡**的 BST 才是；顺序插入 1..n 会退化成链表，见 [Tree Degeneration（树的退化）](#tree-degeneration树的退化)。

也见 [Tree Traversal（树的遍历）](#tree-traversal树的遍历)、[Balanced Tree（平衡树）](#balanced-tree平衡树)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Tree Traversal（树的遍历）

遍历是按某种固定顺序访问树里每一个节点，三种深度优先顺序的区别只看「根在哪一步被访问」：**前序（pre-order）**根 → 左 → 右，用来复制/序列化一棵树；**中序（in-order）**左 → 根 → 右，对 BST 得到升序序列；**后序（post-order）**左 → 右 → 根，用来做自底向上的计算（如统计子树大小、释放内存、表达式求值）。三者都可以用递归几行写完，也可以用显式栈改写（避免深树爆栈）。

**常见误解**：以为三种遍历只是「顺序不一样，结果差不多」。实际它们解决的问题完全不同，选错了算法思路就错了。

也见 [Level-Order Traversal（层序遍历）](#level-order-traversal层序遍历)、[Binary Search Tree（二叉搜索树）](#binary-search-tree二叉搜索树)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Level-Order Traversal（层序遍历）

层序遍历（也叫广度优先遍历 BFS）按「一层一层、从左到右」访问节点，而不是一头扎到底。实现必须借助**队列**：根入队 → 循环「出队一个、访问它、把它的孩子入队」。它天然适合「按距离/层级」办事的场景：求树的最小深度、按层打印、找最近的节点。技巧：如果想区分每一层，可以在每轮循环开始时记录当前队列长度，只处理这么多节点。

**常见误解**：用递归去写层序遍历——递归天然是深度优先，写层序必须用队列（或递归时额外带上层号参数再按层收集）。

也见 [Tree Traversal（树的遍历）](#tree-traversal树的遍历)、[Queue（队列）](#queue队列)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Tree Degeneration（树的退化）

退化指 BST 因为插入顺序不当而长成一条「链」：顺序插入 1, 2, 3, ..., n，每个新节点都往右挂，树高变成 n，于是查找从 O(log n) 恶化成 **O(n)**——BST 的所有优势荡然无存。这是真实的工程风险：从数据库按 id 顺序读出来再逐个插入 BST，就会精确地触发最坏情况。解决办法是使用平衡树，或插入前把数据打乱。

**常见误解**：以为「BST 是 O(log n) 的数据结构」。它只是「O(树高)」，而树高取决于数据，不是结构本身保证的。

也见 [Balanced Tree（平衡树）](#balanced-tree平衡树)、[Best-Worst-Average Case（最好最坏与平均情况）](#best-worst-average-case最好最坏与平均情况)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Balanced Tree（平衡树）

平衡树通过**旋转**等再平衡操作，把树高强行维持在 O(log n)，从而保证最坏情况下所有操作都是 O(log n)，不受插入顺序影响。两种经典方案：**AVL 树**严格控制左右子树高度差不超过 1，因此更「矮」、查找更快，但插入删除时旋转更频繁；**红黑树**用颜色约束把最长路径限制在最短路径的两倍以内，平衡条件更宽松，插入删除的旋转次数更少，因此被大多数标准库采用（如 Java 的 `TreeMap`、C++ 的 `std::map`）。JS 没有内置平衡树，需要有序映射时通常得引第三方库或用排序数组 + 二分查找替代。

**常见误解**：以为平衡树在任何场景都优于哈希表。哈希表平均 O(1) 更快，平衡树的价值在于**有序**——能做范围查询、找前驱后继、按序遍历，这些哈希表都做不到。

也见 [Tree Degeneration（树的退化）](#tree-degeneration树的退化)、[Binary Search Tree（二叉搜索树）](#binary-search-tree二叉搜索树)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Graph（图）

图由**顶点**和**边**组成，用来表达「谁和谁有关系」。它比树更一般——树是「每个节点只有一个父节点、且无环」的特殊图。图的分类维度有三组：有向 / 无向、带权 / 无权、有环 / 无环。绝大多数「关系型」问题都能建模成图：社交网络、依赖关系、路网、状态机、编译器的模块依赖。图算法的成本通常写成 O(V + E)（顶点数 + 边数），而不是 O(n)。

**常见误解**：以为图必须用「图数据库」或某个库。用 `Map<string, string[]>` 表示邻接表，二十行代码就能跑 BFS/DFS。

也见 [Vertex and Edge（顶点与边）](#vertex-and-edge顶点与边)、[Adjacency List and Matrix（邻接表与邻接矩阵）](#adjacency-list-and-matrix邻接表与邻接矩阵)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Vertex and Edge（顶点与边）

**顶点（vertex，也叫节点 node）**是图里的实体，**边（edge）**是顶点之间的连接。一条边连接两个端点，在有向图里有方向和「起点 / 终点」之分。建模时最重要的决策是「什么是顶点」——同一份数据可以建出完全不同的图，例如把「人」当顶点得到关注关系图，把「人和帖子」都当顶点得到二分图。这个决策直接决定了算法能不能用。

**常见误解**：以为顶点必须是「对象」。顶点只是标识符，可以是字符串 id、数字、甚至复合键，只要能被 `Map` 索引即可。

也见 [Graph（图）](#graph图)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Directed and Undirected Graph（有向图与无向图）

**无向图**的边没有方向，A—B 意味着两边互相可达（如好友关系、物理连接）；**有向图**的边带方向，A→B 不蕴含 B→A（如关注、依赖、单向道路）。实现上，无向图的一条边要在邻接表里存两次（A 的邻居里有 B，B 的邻居里也有 A），忘了对称插入是初学最常见的 bug。有向图还多出两个重要概念：**入度 / 出度**，以及只在有向无环图（DAG）上才存在的拓扑排序。

**常见误解**：以为「无向图是特殊的有向图，只是两条边而已」。语义上确实如此，但算法层面差别很大：无向图判环要用「父节点」排除回边，有向图则要用颜色标记或拓扑排序。

也见 [Directed Acyclic Graph（有向无环图）](#directed-acyclic-graph有向无环图)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Weight and Degree（权重与度）

**权重（weight）**是边上的数值，表示「代价」：距离、时间、费用、流量。带权图的最短路不能再用 BFS（BFS 只适用于边权都为 1 的无权图），需要 Dijkstra（非负权）或 Bellman-Ford（可有负权）。**度（degree）**是顶点连接的边数；有向图细分**入度（in-degree）**和**出度（out-degree）**。度有两个非常实用的性质：无向图中所有顶点的度数之和等于边数的两倍（握手定理），以及拓扑排序必须从入度为 0 的顶点开始。

**常见误解**：把权重当作「边走一次要花的钱」以外的含义随意解释。权重是算法真正读取的数据，符号取反（求最长路）会让 Dijkstra 直接失效。

也见 [Shortest Path（最短路径）](#shortest-path最短路径)、[Topological Sort（拓扑排序）](#topological-sort拓扑排序)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Adjacency List and Matrix（邻接表与邻接矩阵）

两种图的存储方式。**邻接表**给每个顶点存一份「邻居名单」（`Map<V, V[]>`），空间 O(V + E)，遍历某点的邻居代价与该点的度成正比——稀疏图（边远少于 V²）的标准选择，也是真实项目里几乎总是正确的选择。**邻接矩阵**是 V×V 的二维表，`m[i][j]` 表示 i 到 j 有没有边（或边权），空间 O(V²)，但「判断两点是否相邻」和「改边权」都是 O(1)。选型只看两个数字：图的稠密程度，以及你最高频的操作是「遍历邻居」还是「查两点是否相连」。

**常见误解**：以为矩阵「更专业」。一万个顶点的图，矩阵要一亿个格子（几百 MB），而邻接表可能只有几万条边——绝大多数业务图都是稀疏的。

也见 [Graph（图）](#graph图)、[Depth-First Search（深度优先搜索）](#depth-first-search深度优先搜索)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Depth-First Search（深度优先搜索）

深度优先搜索（DFS，Depth-First Search）的策略是「一条路走到黑，走不通再回头」——沿着一条边尽可能深入，直到无路可走才回退试别的分支。实现有两种：**递归**（借用函数调用栈，代码最短）和**显式栈**（避免深图爆栈，也能中途暂停）。访问标记 `visited` 是必须的，否则有环的图会无限递归。DFS 擅长：连通性判断、环检测、路径存在性、拓扑排序（后序反转）、求解迷宫、以及「枚举所有方案」。复杂度 O(V + E)。

**常见误解**：以为 DFS 能找到最短路径。**不能**——DFS 找到的是「某一条」路径，第一次到达终点时走的未必是最短的。最短路径要用 [BFS（广度优先搜索）](#breadth-first-search广度优先搜索)。

也见 [Backtracking（回溯）](#backtracking回溯)、[Breadth-First Search（广度优先搜索）](#breadth-first-search广度优先搜索)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Breadth-First Search（广度优先搜索）

广度优先搜索（BFS，Breadth-First Search）的策略是「一圈一圈往外扩」：先访问所有距离为 1 的点，再访问距离为 2 的点。实现必须用**队列**——出队一个点，把它的未访问邻居全部入队。这个「按距离分层」的性质带来 BFS 最重要的用途：**在无权图（或边权全相等）中，BFS 首次到达某点时走过的边数就是最短距离**。它同样适用于树（层序遍历）、网格（最短路步数）、状态空间（最少操作次数）。复杂度 O(V + E)。

**常见误解**：把 BFS 用在带权图上求最短路。一旦边权不相等，「层数」就不再等于「代价」，必须换成 Dijkstra。

也见 [Depth-First Search（深度优先搜索）](#depth-first-search深度优先搜索)、[Shortest Path（最短路径）](#shortest-path最短路径)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Directed Acyclic Graph（有向无环图）

有向无环图（DAG，Directed Acyclic Graph）是有方向且**不存在环**的图。它是「依赖关系」的数学原型：任务 A 必须在 B 之前完成、模块 A 依赖模块 B、课程 A 是课程 B 的先修。DAG 的特殊之处在于存在合法的处理顺序（拓扑序），因此可以做动态规划（按拓扑序递推）、可以并行调度（同层任务可同时跑）。**判环**是使用 DAG 时的第一步：如果存在环，说明依赖相互循环，任何「先做哪个」的方案都不成立。

**常见误解**：以为「没有环」是天然成立的。包管理、构建系统、微服务调用里出现循环依赖是常态，工具必须显式检测并报错。

也见 [Topological Sort（拓扑排序）](#topological-sort拓扑排序)、[Directed and Undirected Graph（有向图与无向图）](#directed-and-undirected-graph有向图与无向图)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Topological Sort（拓扑排序）

拓扑排序把 DAG 的所有顶点排成一个线性序列，使得**每条边 u→v 中 u 都排在 v 前面**。两种实现：**Kahn 算法**（不断取出入度为 0 的顶点、输出、并把它的邻居入度减 1、新产生的 0 入度顶点入队）和 **DFS 后序反转**（DFS 时记录完成顺序，最后反转）。Kahn 算法还有个副作用：如果最后输出的顶点数少于总顶点数，说明图里有环。典型用途：构建顺序（webpack 的模块顺序）、任务调度、课程表、电子表格的公式重算顺序。复杂度 O(V + E)。

**常见误解**：以为拓扑序唯一。绝大多数 DAG 有多个合法拓扑序（只要有互不相关的分支），算法给出哪一个取决于遍历顺序。

也见 [Directed Acyclic Graph（有向无环图）](#directed-acyclic-graph有向无环图)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Shortest Path（最短路径）

最短路径问题是「从起点到终点，走哪条路代价最小」。在**无权图**（或所有边权相等）里，答案是 BFS：因为 BFS 按距离分层扩展，第一次访问到终点时的层数就是最短距离，不需要任何额外的松弛操作。在**带权图**里，BFS 失效，需要 Dijkstra（贪心地每次取出当前最近的未确定点，要求边权非负）或 Bellman-Ford（可处理负权，代价是 O(VE)）。

**常见误解**：以为「最短」一定指边数最少。当边有权重时，「边数少」和「代价小」是两回事——转机两次可能比转机一次更便宜。

也见 [Breadth-First Search（广度优先搜索）](#breadth-first-search广度优先搜索)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Sorting Algorithm（排序算法）

排序算法分两个家族。**O(n²) 家族**（冒泡、选择、插入）都靠「两两比较 + 交换」，思想简单但只适合小数据；其中插入排序在**接近有序**的数据上表现极好（几乎 O(n)），所以常被用作大算法在小数组上的收尾。**O(n log n) 家族**都靠**分治**：归并排序稳定、代价是需要 O(n) 辅助空间；快速排序原地、平均最快、但最坏会退化而且不稳定。工程结论：直接调 `Array.prototype.sort`（引擎内部是 TimSort 或快排+插入的混合），只有在需要特定性质（稳定/原地/外部排序）时才手写。

**常见误解**：以为快排「总是最快的」。对已排序或大量重复的数据，朴素的取首元素作 pivot 会退化成 O(n²)——这就是很多实现要随机化 pivot 或用三路分区的原因。

也见 [Divide and Conquer（分治）](#divide-and-conquer分治)、[Sorting Stability（排序稳定性）](#sorting-stability排序稳定性)、[In-place Sort（原地排序）](#in-place-sort原地排序)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Divide and Conquer（分治）

分治把问题拆成若干个**规模更小的同型子问题**，分别求解后合并结果，三步走：分解（divide）、解决（conquer）、合并（combine）。当子问题缩小到「足够小」时用朴素方法直接处理（递归基）。它的复杂度满足 T(n) = aT(n/b) + f(n)，主定理告诉我们：当子问题数 a 和缩小比例 b 搭配得当（如 a=b=2，即每次对半分并处理两部分），结果就是 O(n log n)。归并排序和快速排序都是分治，差别只在「分解的代价」还是「合并的代价」占主导。

**常见误解**：以为「递归就是分治」。分治要求子问题**不相交**——斐波那契那种子问题互相重叠的递归是动态规划的地盘，不是分治。

也见 [Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)、[Dynamic Programming（动态规划）](#dynamic-programming动态规划)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Partition and Pivot（分区与基准）

这是快速排序的核心步骤。**pivot（基准）**是从当前范围里挑出来的一个「参照值」，**partition（分区）**把数组重排成「小于等于 pivot 的在左、大于 pivot 的在右」，并返回 pivot 的最终位置。经典实现用**双指针**（左右各一个，相向而行、交换逆序对）或**Lomuto 方案**（单指针把小的往前推）。分区完成后，pivot 已经在它最终该在的位置上，再对左右两段递归即可。所以快排的性能几乎完全由「pivot 选得好不好」决定。

**常见误解**：以为分区会「排序」。分区后左右两段内部仍然是乱序的，只保证「左段全部 ≤ pivot ≤ 右段全部」。

也见 [Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)、[Two Pointers（双指针）](#two-pointers双指针)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Sorting Stability（排序稳定性）

如果两个元素的**排序键相等**，排序后它们的相对顺序与排序前一致，这个排序算法就是**稳定的**。为什么这很重要？因为它支持「多轮排序」：先按姓名排、再按年龄排，只要第二次排序是稳定的，同年龄的人内部就保持着姓名的次序——这是分页、报表、多级排序的常见需求。稳定性对照表：冒泡、插入、归并**稳定**；选择、快速、堆排序**不稳定**（堆排序因为要远距离交换元素）。ES `Array.prototype.sort` 从 ES2019 起**规定必须稳定**。

**常见误解**：以为「稳定」是一种性能指标。稳定与快慢无关，它是**语义保证**。另一个误解是靠比较对象引用而不是键来判断，导致结论错误。

也见 [Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)、[In-place Sort（原地排序）](#in-place-sort原地排序)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### In-place Sort（原地排序）

原地排序指只需要 **O(1)（或 O(log n)）额外空间**就能完成的排序，它直接在输入数组上交换元素，不申请一个等长的辅助数组。堆排序和快速排序是原地排序，冒泡/选择/插入也是；**归并排序不是**（它的 merge 步骤需要 O(n) 的辅助数组）。原地的价值在处理大数据时体现：给一亿条记录排序，多要一份 O(n) 内存可能就是几 GB。代价是原地算法通常需要更多次「远距离交换」，对缓存不友好，实际跑起来未必比归并快。

**常见误解**：以为「原地」等于「不消耗内存」。递归本身要占调用栈，快排的栈深度平均是 O(log n)、最坏 O(n)。

也见 [Space Complexity（空间复杂度）](#space-complexity空间复杂度)、[Sorting Stability（排序稳定性）](#sorting-stability排序稳定性)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Binary Search（二分查找）

二分查找在**已排序**的数组里每次把搜索范围砍一半：取中点比较，小了就往右半边找，大了就往左半边找，直到命中或范围为空。复杂度 O(log n)，威力极其可观——十亿条数据最多 30 次比较。边界条件是它真正的难点：`while (lo <= hi)` 还是 `lo < hi`？中点用 `Math.floor((lo + hi) / 2)` 还是 `lo + Math.floor((hi - lo) / 2)`？返回 `lo` 还是 `-1`？建议固定一套模板（找目标是否存在用闭区间 `lo <= hi`；找插入位置用左闭右开 `lo < hi`），并想清楚「循环不变式」，而不是靠试。

**常见误解**：`(lo + hi) / 2` 在别的语言里会整数溢出；JS 里没有这个问题，但用 `lo + (hi - lo) / 2` 依然是更稳妥的习惯。另一个误解是「数组差不多有序也可以用二分」——不行，二分对数据的有序性是硬要求。

也见 [Binary Search on Answer（二分答案）](#binary-search-on-answer二分答案)、[Asymptotic Analysis（渐进分析）](#asymptotic-analysis渐进分析)。

示例：[`38_algorithms_and_data_structures/09_searching_algorithms.js`](38_algorithms_and_data_structures/09_searching_algorithms.js)

### Binary Search on Answer（二分答案）

二分答案是一种「不直接搜索数组，而是搜索**答案的取值空间**」的技巧：当问题的答案具有**单调性**（如果 x 可行，那么所有比 x 更宽松/更大的值也可行，反之亦然）时，就可以对答案本身做二分，每次用 O(n) 的代价「验证这个答案行不行」，总复杂度 O(n log C)。典型题：把货物分成 k 份使最大份最小、安排 k 天内完成的最少容量、分割数组的最大值最小。它是把「优化问题」转化成「判定问题」的经典手段。

**常见误解**：以为二分答案需要答案空间有序。不需要——需要的只是**判定函数的单调性**，取值空间本身可以是任意连续区间甚至离散集合。

也见 [Binary Search（二分查找）](#binary-search二分查找)、[Greedy Algorithm（贪心算法）](#greedy-algorithm贪心算法)。

示例：[`38_algorithms_and_data_structures/09_searching_algorithms.js`](38_algorithms_and_data_structures/09_searching_algorithms.js)

### Dynamic Programming（动态规划）

动态规划（DP）解决的是「大问题能拆成一堆**重叠的子问题**，且大问题的最优解可由子问题的最优解拼出来」这类问题。核心动作只有两个：把子问题的答案**记下来**（避免重复计算），再用子问题的答案**推出**大问题的答案（状态转移）。它适用与否看两个信号：**最优子结构**（整体最优由局部最优构成）和**重叠子问题**（朴素递归会反复算同一个子问题）。典型问题：斐波那契、背包、编辑距离、最长公共子序列、找零钱。

**常见误解**：以为「能递归就是 DP」。没有重叠子问题时（如归并排序），缓存毫无收益，那是分治不是 DP；而一旦子问题重叠，朴素递归可能从 O(n) 爆炸成 O(2ⁿ)。

也见 [Memoization（备忘录法）](#memoization备忘录法)、[Divide and Conquer（分治）](#divide-and-conquer分治)、[Greedy Algorithm（贪心算法）](#greedy-algorithm贪心算法)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Optimal Substructure（最优子结构）

最优子结构指「一个问题的最优解，一定由它子问题的最优解组合而成」——这是 DP 能成立的前提。用反证法验证最方便：如果存在一个更好的子问题解能让整体更优，那说明原来的不是最优，矛盾。经典反例是「最长简单路径」：子路径的最长并不构成整体最长（子路径之间可能冲突），所以它没有最优子结构，不能用朴素 DP。要注意它和**贪心选择性质**的区别：最优子结构是 DP 的必要条件，而贪心还额外要求「局部最优选择不会让后续变差」。

**常见误解**：把最优子结构当作 DP 的充分条件。它只是前提之一，还需要重叠子问题，否则分治就够用了。

也见 [Dynamic Programming（动态规划）](#dynamic-programming动态规划)、[Overlapping Subproblems（重叠子问题）](#overlapping-subproblems重叠子问题)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Overlapping Subproblems（重叠子问题）

重叠子问题指「递归展开后，同一个子问题被反复求解」。它是 DP 与分治的分水岭：归并排序的两半互不相干（不重叠，用分治）；斐波那契 `f(5)` 需要 `f(4)` 和 `f(3)`，而 `f(4)` 又需要 `f(3)`——`f(3)` 被算了两次，随 n 增大重复次数指数级爆炸。一旦确认重叠，加一个「缓存表」就能把指数复杂度压成多项式。

**常见误解**：以为「有重叠就必须用 DP」。如果子问题数量很小、重复次数很少，缓存带来的额外开销（哈希查找、内存）反而得不偿失。

也见 [Dynamic Programming（动态规划）](#dynamic-programming动态规划)、[Memoization（备忘录法）](#memoization备忘录法)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### State Transition Equation（状态转移方程）

状态转移方程是 DP 的「公式部分」：用已知子问题的答案表达当前问题的答案。写 DP 的顺序是固定的四步：① 定义**状态** `dp[i]` 的**含义**（这一步最关键，且必须是「无后效性」的——只依赖已算出的状态）；② 写出**转移方程**（如 `dp[i] = dp[i-1] + dp[i-2]`）；③ 确定**初始条件**（`dp[0]`、`dp[1]`）；④ 确定**遍历顺序**（保证计算 `dp[i]` 时它依赖的状态已经算好）。常见误解：跳过第 ① 步直接抄别人的方程——方程对了但状态含义理解错了，遇到变体就写不出来。

也见 [Top-down and Bottom-up（自顶向下与自底向上）](#top-down-and-bottom-up自顶向下与自底向上)、[Dynamic Programming（动态规划）](#dynamic-programming动态规划)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Top-down and Bottom-up（自顶向下与自底向上）

DP 的两种实现方向。**自顶向下（top-down）**从原问题出发递归，遇到没算过的子问题才算并缓存（即记忆化搜索）——写起来就是「朴素递归 + 一行缓存」，最贴近状态转移方程，缺点是递归深度可能爆栈。**自底向上（bottom-up）**直接从最小的子问题开始循环填表，一路推到目标——没有递归开销，方便做「滚动数组」把空间从 O(n²) 压到 O(n)，缺点是需要自己想清楚遍历顺序。两者时间复杂度相同，工程上通常先写自顶向下验证正确性，再改自底向上做优化。

**常见误解**：以为「递推」和「递归」是 DP 的分类。真正的分类轴是「计算方向的起点」，而非实现语法。

也见 [Memoization（备忘录法）](#memoization备忘录法)、[State Transition Equation（状态转移方程）](#state-transition-equation状态转移方程)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Memoization（备忘录法）

备忘录法（记忆化搜索）是自顶向下 DP 的实现手段：在递归函数入口查缓存，命中就返回，未命中就计算并把结果写进缓存再返回。JS 里可以用 `Map` 以参数拼成的字符串为键，也可以直接在数组上打标记。它把「指数级的重复计算」压缩成「每个子问题只算一次」。工程上它还有更广阔的应用：给纯函数加一层缓存（memoize 高阶函数）就是通用性能优化手段。

**常见误解**：把 memoize 用在**有副作用或非纯**的函数上。如果函数依赖外部可变状态或做了 IO，缓存返回的就是过期的错误结果——记忆化只对纯函数安全。

也见 [Top-down and Bottom-up（自顶向下与自底向上）](#top-down-and-bottom-up自顶向下与自底向上)、[Pure Function（纯函数）](#pure-function纯函数)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)、[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Greedy Algorithm（贪心算法）

贪心算法在每一步都选「当下看起来最好的那个选项」，且**不回头**。它写起来通常只有几行，但**正确性需要证明**：只有当问题同时具备**贪心选择性质**（局部最优能推出全局最优）和**最优子结构**时才对。经典可用的例子：活动选择、找零（面额规范时）、Huffman 编码、单源最短路 Dijkstra。经典的失败例子：0-1 背包（贪心按性价比拿会漏掉更优组合，必须用 DP）、找零（面额 1/3/4 找 6，贪心给 4+1+1 共三枚，最优是 3+3 两枚）。

**常见误解**：以为「看起来对」就是对的。贪心是**最需要验证**的算法族——判断标准很简单：能不能构造一个反例。

也见 [Dynamic Programming（动态规划）](#dynamic-programming动态规划)、[Binary Search on Answer（二分答案）](#binary-search-on-answer二分答案)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Backtracking（回溯）

回溯是「系统地枚举所有可能解」的框架：做选择 → 递归进入下一层 → **撤销选择**（这就是「回溯」二字的含义）→ 试下一个选择。它是深度优先搜索在「解空间树」上的应用，模板几乎固定：`if (满足结束条件) 收集结果; for (每个候选) { 做选择; backtrack(); 撤销选择; }`。适用于组合、排列、子集、N 皇后、数独、单词搜索、以及图里的路径枚举。剪枝（提前排除不可能的分支）是它能否跑完的关键。

**常见误解**：忘了「撤销选择」这一句，导致后续分支带着被污染的状态运行——这是回溯最常见的 bug。另外要注意「收集结果时是否需要深拷贝」，直接把结果数组 push 进去会因为后续修改而全部变成同一份。

也见 [Depth-First Search（深度优先搜索）](#depth-first-search深度优先搜索)、[Dynamic Programming（动态规划）](#dynamic-programming动态规划)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)、[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Two Pointers（双指针）

双指针指「同时维护两个下标，用它们的相对运动来替代嵌套循环」，从而把 O(n²) 降到 O(n)。常见形态有三类：**相向双指针**（左右夹逼，用于有序数组的两数之和、反转、分区）；**同向双指针 / 快慢指针**（用于原地去重、找链表中点、判环）；以及**滑动窗口**（两个指针构成的窗口）。能用的前提通常是数据有序，或者问题具有「移动某个指针不会漏解」的单调性质。

**常见误解**：以为双指针是某个具体算法。它是一类**技巧模板**，识别信号是「有序数组 + 找一对/一段 + 暴力是双重循环」。

也见 [Sliding Window（滑动窗口）](#sliding-window滑动窗口)、[Partition and Pivot（分区与基准）](#partition-and-pivot分区与基准)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Sliding Window（滑动窗口）

滑动窗口是用两个指针维护一个**连续区间** `[left, right)`，通过扩大右边界纳入新元素、收缩左边界排除旧元素，在一次遍历内处理所有「连续子数组/子串」问题。它的前提是**窗口的某个指标具有单调性**（如「窗口内元素和」随右扩增大、随左缩减小），这样才能在窗口违反约束时安全地移动左指针，而不需要回头重算。典型应用：最长无重复字符子串、和 ≥ target 的最短子数组、限流（统计最近 1 秒内的请求数）、时间序列的移动平均。

**常见误解**：以为所有子数组问题都能用滑动窗口。如果数组中含**负数**，「窗口和」不再单调，窗口就不能安全收缩——此时要么改用前缀和 + 哈希表，要么用 DP。

也见 [Two Pointers（双指针）](#two-pointers双指针)、[Deque（双端队列）](#deque双端队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

## 工程化工具链

### package.json（package.json 清单文件）

`package.json` 是 Node.js 项目根目录下的 JSON 文件，同时承担三件事：描述包**是什么**（`name`/`version`/`description`/`license`）、描述包**怎么用**（`type`/`main`/`exports`/`files`）、描述**依赖谁、怎么跑**（`dependencies`/`scripts`/`engines`）。npm、pnpm、yarn 和 Node.js 本身都会读它。关键细节：它是**严格 JSON**——不能写注释、不能有尾随逗号、不能用单引号，这是初学者最常见的报错来源。

**常见误解**：以为 `package.json` 是给 npm 用的配置文件。它其实是**包的公开契约**：别人 `npm install` 你的包时，决定他们看到什么、怎么引入的，就是这些字段。

也见 [Package Entry Fields（包的入口与暴露字段）](#package-entry-fields包的入口与暴露字段)、[Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)。

示例：[`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)

### Package Entry Fields（包的入口与暴露字段）

一组决定「包怎么被消费」的字段。`main`：CommonJS 的入口文件，老工具的兜底。`module`：打包器（非 Node）使用的 ESM 入口，属于社区约定而非规范。`exports`：现代、权威的**条件导出表**，可以按 `import`/`require`/`node`/`browser` 等条件分别指定入口，同时**把未列出的路径彻底封死**（子路径封装）。`files`：发布时只打包哪些文件/目录的白名单，直接影响产物体积（`node_modules`、`src` 默认不进包）。`engines`：声明支持的 Node 版本，npm 默认只警告不阻止，除非开启 `engine-strict`。

**常见误解**：以为加了 `exports` 就万事大吉。`exports` 一旦存在，`main` 对现代 Node 就失去意义，且**深路径导入**（`pkg/lib/x.js`）会立刻失效——这是发布新版本时最常见的破坏性变更。

也见 [package.json（package.json 清单文件）](#packagejsonpackagejson-清单文件)、[Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)。

示例：[`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)

### npm scripts（npm 脚本）

`scripts` 字段是一张「命令名 → shell 命令」的映射表。执行 `npm run <名字>` 时，npm 会：把命令交给系统 shell；在 `PATH` 最前面插入本项目及各级父目录的 `node_modules/.bin`；注入一批 `npm_` 开头的环境变量；并按 `pre<名字>` → `<名字>` → `post<名字>` 的顺序执行。所以 scripts 不是新语法，它只是**带 PATH 注入和钩子的 shell 命令别名**——这正是为什么 `npm run lint` 里可以直接写 `eslint` 而不必写完整路径。

**常见误解**：以为 scripts 是跨平台保证。它本质是 shell 命令，`rm -rf`、`&&` 在 Windows 的 cmd 下行为不同，跨平台请用 `rimraf`、`cross-env` 这类工具。

也见 [Lifecycle Scripts（生命周期脚本）](#lifecycle-scripts生命周期脚本)、[lint-staged（lint-staged）](#lint-stagedlint-staged)。

示例：[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

### Lifecycle Scripts（生命周期脚本）

生命周期脚本是 npm 在特定时刻**自动**触发的 scripts，分为两类。一是**任意脚本的 `pre`/`post` 钩子**：定义 `prebuild` 和 `postbuild` 后，`npm run build` 会自动按序执行三者。二是**包的固定生命周期**：`prepare`（`npm install` 本地安装和 `npm publish` 前都跑，常用于构建产物）、`prepublishOnly`（只在发布前跑，用于跑测试）、`prepack`/`postpack`、`preinstall`/`postinstall`（安装前后）。注意 `prepublish` 已废弃，不要再用。

**常见误解**：以为 `postinstall` 是「安装后运行我的初始化脚本」的安全位置。它确实会跑，但依赖的 `postinstall` 在别人机器上也会执行任意代码，这既是供应链攻击的常见入口，也让 CI 变慢——所以很多团队用 `--ignore-scripts` 禁掉它。

也见 [npm scripts（npm 脚本）](#npm-scriptsnpm-脚本)、[Release Process（发布流程）](#release-process发布流程)。

示例：[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

### Semantic Versioning（语义化版本）

语义化版本（Semantic Versioning，semver）规定版本号写成 `MAJOR.MINOR.PATCH`，并给每一段赋予**约定俗成的含义**：MAJOR 是破坏性变更（breaking change），MINOR 是向后兼容的新功能，PATCH 是向后兼容的 bug 修复。它的价值在于让「版本号」变成一种**契约**：消费方看到 MINOR 升级就敢直接升，看到 MAJOR 升级就知道要读迁移文档。`0.x.y` 是特例——按规范它表示「初始开发阶段，任何版本都可能破坏兼容」。

**常见误解**：以为版本号是自动递增的。semver 描述的是**你对使用者做出的承诺**，涨哪一位是维护者的人工判断，工具（如 changesets）只是帮你记账。

也见 [MAJOR-MINOR-PATCH（主次修订号）](#major-minor-patch主次修订号)、[Version Range（版本范围）](#version-range版本范围)。

示例：[`39_tooling_and_workflow/03_semver.js`](39_tooling_and_workflow/03_semver.js)

### MAJOR-MINOR-PATCH（主次修订号）

三段版本号各自的含义与判断标准：**MAJOR**（主版本）——任何会让现有代码跑不起来的改动：删掉导出的函数、改函数签名、改默认值语义、把 `main` 换成 `exports` 并封死深路径；**MINOR**（次版本）——新增能力，老代码完全不受影响：加一个新导出、加一个可选参数；**PATCH**（修订号）——不改变任何公开行为的修复：修 bug、改文档、性能优化。判断口诀：**对使用者的代码有没有影响？没有就是 PATCH，只有增加就是 MINOR，有删除或改变就是 MAJOR。**

**常见误解**：把「我自己改了内部实现」当成 MINOR。只要使用者观察不到行为变化，就该是 PATCH；反过来，即使只改了一行，只要破坏了别人依赖的行为，就必须是 MAJOR。

也见 [Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)、[Version Range（版本范围）](#version-range版本范围)。

示例：[`39_tooling_and_workflow/03_semver.js`](39_tooling_and_workflow/03_semver.js)

### Version Range（版本范围）

版本范围是写在 `package.json` 里、告诉包管理器「我能接受哪些版本」的表达式。常用写法：`^1.2.3`（兼容范围，允许 ≥1.2.3 且 <2.0.0，最常用）、`~1.2.3`（只允许补丁级，≥1.2.3 且 <1.3.0）、`1.2.x`、`>=1.2.3 <2.0.0`（显式区间）、`*` 或 `latest`（任意版本，生产环境应避免）。关键认识：范围是**声明意图**，不是**确定结果**——`^1.2.3` 意味着「下次安装可能装到 1.9.0」，具体装到哪个由锁文件决定。

**常见误解**：以为 `^` 表示「固定在这个版本附近」。它允许相当大的浮动（整个 MAJOR 内），依赖方在 MINOR 里不小心引入破坏性变更时，你就会莫名其妙地挂掉——这正是锁文件存在的理由。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)。

示例：[`39_tooling_and_workflow/03_semver.js`](39_tooling_and_workflow/03_semver.js)

### Lockfile（锁文件）

锁文件（`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`）是包管理器在安装后自动生成的**依赖树快照**，逐条记录每个包的精确版本、下载地址（resolved）、内容哈希（integrity）以及它是不是开发依赖。它补齐了 `package.json` 只写「范围」而无法确定「具体版本」的缺口，从而让安装结果**可复现**：任何时间、任何机器、任何人，装出来的树完全一致。锁文件**必须提交到版本库**，否则等于白写。

**常见误解**：以为锁文件是「本地缓存文件」所以应该 gitignore。正相反——它是团队一致性的基石；把它忽略掉会让每个人装出不同的依赖树，CI 也就失去了意义。

也见 [npm ci（npm ci）](#npm-cinpm-ci)、[Reproducible Build（可复现构建）](#reproducible-build可复现构建)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### npm ci（npm ci）

`npm ci` 是专为自动化环境（CI、Docker 构建）设计的安装命令。它与 `npm install` 的四个关键差别：① 严格按锁文件安装，**完全忽略** `package.json` 里的范围，装出的版本与锁文件逐字节一致；② 如果锁文件缺失或与 `package.json` 不同步，直接**报错退出**而不是悄悄修复；③ 安装前会先删除 `node_modules`，保证是干净环境；④ 因为它知道要装什么，不做依赖求解，速度显著更快。结论：**开发时用 `npm install`，CI 和部署用 `npm ci`。**

**常见误解**：以为 `npm ci` 只是「更快的 install」。它真正的价值是**失败得响亮**——你改了 `package.json` 却忘了更新锁文件时，CI 会立刻告诉你，而不是让你的构建悄悄跑在一个不存在于任何地方的依赖组合上。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Continuous Integration（持续集成）](#continuous-integration持续集成)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Reproducible Build（可复现构建）

可复现构建指「同样的源码 + 同样的锁文件，在任何机器上得到**逐字节相同**的产物」。它是三件事共同保证的：锁文件钉死依赖版本、`npm ci` 保证安装过程确定、构建工具关闭时间戳/随机数/绝对路径等不确定性来源。为什么值得追求？因为它让「本机跑得好，线上就崩」这类问题变成可排查的：产物可对比、构建可缓存、缓存命中就真的安全。它是供应链安全的基石——产物可复现，才能验证发布的二进制确实来自公开的源码。

**常见误解**：以为「锁了依赖版本」就等于可复现。转译器版本、Node 版本、环境变量、文件系统遍历顺序（`readdir` 返回顺序）都会影响输出，必须一并钉死。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Build Artifact（构建产物）](#build-artifact构建产物)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### Linter（代码检查器）

linter（以 ESLint 为代表）是**静态分析工具**：它不执行代码，而是把源码解析成抽象语法树（AST），再让一条条「规则」去检查这棵树。它专治「JS 这门语言允许、但几乎一定是写错了」的那类问题：拼错的变量名、忘了 `await` 的 Promise、`==` 带来的隐式转换、声明了却没用过的变量、不可达代码、误用 `this`。因为是在**运行前**发现，它比等测试或线上报错要便宜得多，而且能给出统一的修复建议。

**常见误解**：以为 linter 能替代测试或类型检查。它只做**语法和模式**层面的检查，不理解业务语义；`const x = await fetchUser()` 里 `x` 是不是真的用户对象，linter 无从判断。

也见 [Formatter（代码格式化器）](#formatter代码格式化器)、[ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Severity（严重度）](#severity严重度)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### Formatter（代码格式化器）

formatter（以 Prettier 为代表）是**只负责排版、不管逻辑**的工具：把源码交给它，它按一套固定规则重新打印一遍，决定「这行该不该换行、缩进几个空格、用单引号还是双引号、末尾要不要逗号」。它的关键特征是**固执己见（opinionated）且几乎不可配置**——这种限制是刻意的：目标不是让你配出理想风格，而是让**所有人不再讨论风格**。它完全理解不了你的业务逻辑，也不判断对错。

**常见误解**：把 Prettier 和 ESLint 混为一谈，或者在 ESLint 里装一堆格式化类规则。正确分工是：**Prettier 管排版（可自动改且无争议），ESLint 管正确性与代码质量（改法有争议或需人判断）**。为此 ESLint 提供了 `eslint-config-prettier` 来关掉所有与 Prettier 冲突的格式规则。

也见 [Linter（代码检查器）](#linter代码检查器)、[Flat Config（平面配置）](#flat-config平面配置)。

示例：[`39_tooling_and_workflow/05_prettier.js`](39_tooling_and_workflow/05_prettier.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### ESLint Rule（ESLint 规则）

规则是 ESLint 的最小检查单元：每条规则负责一个具体判断（如 `no-unused-vars` 找未使用变量、`eqeqeq` 禁止 `==`、`no-floating-promises` 要求处理 Promise），并可以被单独配置严重度和参数。规则有三种来源：ESLint 内置、插件提供（如 `eslint-plugin-react`、`@typescript-eslint`）、以及项目自己写的自定义规则。开规则有三种粒度：`extends` 继承一份预设（如 `eslint:recommended`）、`plugins` 引入插件、`rules` 逐条微调。真实项目的做法通常是「继承两三份预设 + 关掉几条不合适的 + 打开几条团队特有的」。

**常见误解**：以为预设开得越多越好。规则不是越多越安全，噪音大的规则（例如把 `console.log` 一律报错）会让团队养成「无脑 `--fix` 或加 ignore」的习惯，反而让真正的问题被淹没。

也见 [Severity（严重度）](#severity严重度)、[--fix（自动修复）](#--fix自动修复)、[Flat Config（平面配置）](#flat-config平面配置)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### Severity（严重度）

ESLint 每条规则可以配三种严重度：`off`（0，关闭）、`warn`（1，警告——不影响退出码，只提示）、`error`（2，错误——会让 `eslint` 命令以非零码退出，从而让 CI 失败）。这个三档设计是**渐进式落地**的关键：接手一个老项目时，先把所有规则设为 `warn` 跑通，再逐条改成 `error`，而不是一次性开满导致 CI 全红。另外很多规则支持传入额外选项，写法是数组 `['error', { ... }]`。

**常见误解**：以为 `warn` 和 `error` 只是显示颜色不同。真正的区别在**退出码**：CI 只认退出码，因此只有 `error` 才能形成硬性门禁——把关键规则设在 `warn` 等于没设。

也见 [ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Test Gate（测试门禁）](#test-gate测试门禁)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### --fix（自动修复）

ESLint 的 `--fix` 参数会尝试自动修复「可以安全修复」的规则违规（如多余的引号、缺的分号、可以改成 `const` 的 `let`），修完把剩余无法自动修复的问题打印出来。可自动修复的规则在文档里标有小扳手图标。使用姿势有两种：一次性全量跑 `eslint . --fix`，或在编辑器里保存时自动修复（`editor.codeActionsOnSave`）。注意 Prettier 也有 `--write`，两者在保存时通常一起触发。

**常见误解**：以为 `--fix` 能修所有问题。需要理解语义才能修的（未使用变量要不要删、`==` 改成 `===` 会不会改变行为）一律不自动修；另外 `--fix` **会改动源文件**，在 CI 里应该用 `--max-warnings 0` 做检查而不是 `--fix`，否则相当于在 CI 里改代码。

也见 [ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Formatter（代码格式化器）](#formatter代码格式化器)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### Flat Config（平面配置）

Flat config 是 ESLint 从 v9 起的默认配置格式，配置文件名为 `eslint.config.js`，导出一个**数组**。它取代了旧的 `.eslintrc.*`（eslintrc 体系），核心变化有三：① 配置从「层级继承 + 就近覆盖」变成**一个扁平数组**，`files` 匹配哪些文件、其余键就是该文件的配置；② `plugins` 从字符串名字（需要靠命名约定解析）变成**直接导入的对象**，因此不需要再关心 `eslint-plugin-` 前缀；③ 每一项可以用 `ignores` 表示忽略，也可以用 `extends`（v9.15+）复用现成预设。数组的顺序就是优先级——后面的项覆盖前面的。

**常见误解**：把旧的 `.eslintrc.json` 里的 `extends`/`overrides` 直接搬进 flat config。结构完全不同，必须重写；项目里如果同时存在两种配置文件，行为会非常难以预料。

也见 [ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Linter（代码检查器）](#linter代码检查器)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### Bundler（打包器）

bundler（webpack、Rollup、esbuild、Vite、Rspack 等）把成百上千个源码模块**合并成浏览器能直接加载的少数几个文件**。它从**入口**出发，沿 `import`/`require` 递归解析，构建出**依赖图**，然后按图生成产物，顺便完成转译、压缩、资源处理（CSS/图片）等工作。为什么浏览器早已原生支持 `import` 还要打包？三个现实原因：**请求瀑布**（200 个模块意味着 200 次请求）、**裸模块说明符无法直接加载**（浏览器不认识 `import x from 'lodash'`）、以及**产物优化**（tree-shaking、压缩、代码分割）只有拿到全图才能做。

**常见误解**：以为「打包 = 转译」。这是两件事：打包关心**文件怎么组合**，转译关心**语法怎么写**；只是现代工具链常常一起做。

也见 [Entry Point（入口）](#entry-point入口)、[Dependency Graph（依赖图）](#dependency-graph依赖图)、[Transpile（转译）](#transpile转译)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Entry Point（入口）

入口是打包器**开始遍历依赖图的起点**，通常配置成 `src/index.js`、`src/main.js` 或一个由 HTML 引用的脚本。入口决定了「什么会被打进产物」：从入口可达的模块才会进入依赖图，不可达的模块直接被丢掉——这正是 tree-shaking 的基础。多入口（数组或对象）会产出多份产物，用于「一个站点多个独立页面」的场景；入口也可以配成对象来给每个 chunk 命名。库作者打包时还要注意 `externals`（把 `react` 等留给使用者提供，不要打进去）。

**常见误解**：以为入口是「代码执行的第一行」。它是**静态分析的起点**；真正的执行顺序由运行时按导入顺序决定，两者不一定一致。

也见 [Bundler（打包器）](#bundler打包器)、[Dependency Graph（依赖图）](#dependency-graph依赖图)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Dependency Graph（依赖图）

依赖图是打包器对项目内部 `import`/`require` 关系建模得到的**有向图**：每个模块是一个顶点，每条导入是一条有向边。它必然是**有向无环图**（DAG）——出现环意味着循环依赖，打包器要么报错要么按某种顺序打破它。有了全图，工具才能做后续的一切：确定打包顺序、识别哪些模块是重复的（去重）、哪些导出从未被使用（tree-shaking）、哪些模块可以拆成独立 chunk（代码分割）。所以「打包慢」通常不是压缩慢，而是**构建这张图慢**（文件 IO + 解析）。

**常见误解**：以为依赖图只包含 `import` 语句。动态 `import()`、`require` 表达式、甚至 CSS 和图片的引用都会成为边，这也是为什么一个看似无关的文件改动会让整个产物哈希变化。

也见 [Bundler（打包器）](#bundler打包器)、[Tree-shaking（tree-shaking）](#tree-shakingtree-shaking)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Tree-shaking（tree-shaking）

tree-shaking 是打包器的**死代码消除**能力：既然拿到了完整依赖图，就能判断某个导出是否真的被任何地方使用，未被使用的就不写进产物。它得名的比喻是「摇树，让枯叶掉下来」。能生效有三个前提：① 用**静态的 ESM `import`/`export`**（CommonJS 的 `require` 是运行时求值，无法静态分析，所以 CJS 包基本摇不动）；② 打包器能确定模块**没有副作用**；③ 代码不要写成「把整个库挂到对象上再动态取」的形式。副作用声明见 `sideEffects` 字段。

**常见误解**：以为只要用 ESM 写就一定能把没用的代码摇掉。`import './polyfill'` 这种**只导入不绑定**的写法、以及顶层执行的表达式，都会被保守地保留。

也见 [sideEffects（副作用标记）](#sideeffects副作用标记)、[Bundler（打包器）](#bundler打包器)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### sideEffects（副作用标记）

`sideEffects` 是 `package.json` 里给打包器看的**提示字段**，用来告诉它「这个包的模块在被导入时会不会产生副作用」。默认（不写）是「可能有」，打包器就会保守地把整个模块保留；写 `"sideEffects": false` 表示「本包里所有的模块导入都纯粹是定义，删掉没用的不会改变行为」，从而允许 tree-shaking 大胆剪枝；也可以给数组精确豁免：`"sideEffects": ["*.css", "./src/polyfill.js"]`。之所以需要它，是因为打包器无法自动判断「一个被 import 却没被使用的模块」，到底是纯粹没用到，还是它的顶层代码在做注册/补丁这类必须保留的事。

**常见误解**：把它当成「性能开关」随意设为 `false`。如果你的包有 `import './patch-something'` 这种写法，声明 `false` 会让打包器把它删掉，使用者的运行时行为随之改变——这是一个**语义声明**，必须准确。

也见 [Tree-shaking（tree-shaking）](#tree-shakingtree-shaking)、[package.json（package.json 清单文件）](#packagejsonpackagejson-清单文件)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)、[`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)

### Code Splitting（代码分割）

代码分割把产物**拆成多个文件（chunk）**而不是一个大 bundle，从而让首屏只加载必需的代码。三种做法：**多入口**（天然多个 chunk）、**动态 `import()`**（在代码执行到那行时才去下载对应 chunk，是主流方式）、以及**基于路由/组件的自动分割**（框架如 Vite/Next 的路由级分割）。打包器还会自动抽出被多个 chunk 共享的模块成为公共 chunk（`splitChunks` / `manualChunks`），避免重复下载。它的收益是首屏 JS 体积下降，代价是请求数增加、需要处理加载中状态和失败重试。

**常见误解**：以为分割得越细越好。每个 chunk 都是一个 HTTP 请求和一段解析开销，过度切割（比如每个组件一个 chunk）会让「按需加载」的总代价反而超过一次性加载。

也见 [Lazy Loading（懒加载）](#lazy-loading懒加载)、[Bundler（打包器）](#bundler打包器)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Lazy Loading（懒加载）

懒加载指「**用到时才加载**」，在 JS 里的标准写法是动态 `import()`：它返回一个 Promise，解析出模块命名空间对象，例如 `const { renderChart } = await import('./chart.js')`。它和代码分割是**因果配对**：`import()` 是「因」（告诉打包器这里是分割点），代码分割是「果」（打包器据此生成独立 chunk），运行时再由浏览器按需拉取。典型用法：路由切换时加载页面、点开弹窗时才加载重量级编辑器、浏览器空闲时才加载埋点 SDK。要把加载中、加载失败的状态交给 UI 处理。

**常见误解**：以为动态 `import()` 和静态 `import` 只是写法差别。动态导入的模块**不是**在文件顶部就绪的，任何假设它同步可用的代码都会拿到 `undefined`；此外它也无法被 tree-shaking 充分优化。

也见 [Code Splitting（代码分割）](#code-splitting代码分割)、[Bundler（打包器）](#bundler打包器)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)、[`19_modules/09_dynamic_import.js`](19_modules/09_dynamic_import.js)

### Transpile（转译）

转译（transpiling）是把**一种语言的源码改写成另一种（通常是同族但更旧的）语法**，让老环境也能跑新语法。它做的是语法层面的等价变换：箭头函数 → `function`、可选链 `a?.b` → 三元表达式、`async/await` → generator + Promise 状态机、类字段 → 构造函数里的赋值。它**不做**类型检查（那是 TypeScript 的 `tsc --noEmit` 或类型感知检查的职责），也**不做** polyfill（新 API 如 `Array.prototype.at` 需要引入运行时垫片，语法糖转译不出来）。

**常见误解**：以为「转译了就能在 IE 跑」。转译只解决**语法**，不解决**内建对象和 API**；`Promise`、`fetch`、`Object.fromEntries` 这类缺失仍然是运行时错误，必须靠 polyfill。

也见 [Babel（Babel）](#babelbabel)、[Target Environment（目标环境）](#target-environment目标环境)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Babel（Babel）

Babel 是 JS 生态最主流的转译器，工作方式是把源码解析成 AST，再让一系列**插件（plugin）**逐个改写 AST，最后生成代码——所以「Babel 能干什么」完全取决于装了哪些插件。实际使用时用**预设（preset）**成组引入：`@babel/preset-env` 按目标环境自动决定需要哪些语法转换插件，`@babel/preset-react` 处理 JSX，`@babel/preset-typescript` 只剥掉类型注解（不做类型检查）。它还可以通过 `@babel/plugin-transform-runtime` 复用辅助代码而不是每个文件内联一份，减小体积。

**常见误解**：以为 Babel 会做类型检查。`@babel/preset-typescript` 只负责「把类型擦掉让代码能跑」，类型错误的发现必须交给 `tsc`——这也是「Babel 编译通过但类型是错的」这一常见困惑的来源。

也见 [Transpile（转译）](#transpile转译)、[Target Environment（目标环境）](#target-environment目标环境)、[browserslist（browserslist）](#browserslistbrowserslist)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Target Environment（目标环境）

目标环境是「你希望产物能跑在哪些运行环境上」的声明，它直接决定转译和 polyfill 的力度：目标定得越旧，需要转换的语法越多、产物越大、运行越慢。它通常不写在 Babel 配置里，而是由 `browserslist` 字段（或 `.browserslistrc`）统一提供，被 Babel、PostCSS、autoprefixer、esbuild 等工具共同读取。此外还有 **`engines`** 字段描述 Node 侧的目标版本——两件事要分清：`browserslist` 面向浏览器（打包产物用），`engines` 面向 Node（npm 包或服务端用）。

**常见误解**：把目标环境当成「越兼容越好」。为了 0.1% 的老浏览器把全站代码降级，会让 99.9% 的用户下载更大更慢的包——目标环境是一个**产品决策**，通常根据真实埋点数据划定。

也见 [browserslist（browserslist）](#browserslistbrowserslist)、[Babel（Babel）](#babelbabel)、[Transpile（转译）](#transpile转译)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### browserslist（browserslist）

`browserslist` 是一个**共享的目标环境查询语言**，写在 `package.json` 的 `browserslist` 字段或根目录的 `.browserslistrc` 里，用查询串描述你支持哪些浏览器，例如 `"last 2 versions"`、`"> 0.5%"`、`"not dead"`、`"defaults"`。它本身不做任何转换，而是被 Babel、autoprefixer、PostCSS、esbuild 等一大批工具读取，从而让整条工具链的目标环境保持一致。工程价值在于**单一事实来源**：改一行配置，所有工具的兼容范围一起变。可以用 `npx browserslist` 查看当前查询实际命中了哪些浏览器。

**常见误解**：以为它是个打包工具或 Babel 插件。它只是一个查询库；另外注意查询结果是**随时间变化**的（`last 2 versions` 今天和明年命中的版本不同），所以它和可复现构建有一点天然张力。

也见 [Target Environment（目标环境）](#target-environment目标环境)、[Babel（Babel）](#babelbabel)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Build Artifact（构建产物）

构建产物是构建流程的输出：一个 `dist/` 或 `build/` 目录，里面是压缩后的 JS/CSS、静态资源、以及 source map。它有三个重要性质：**它不该进版本库**（应写进 `.gitignore`，因为它是可再生的，提交它会造成冲突和无意义的 diff）；**它是发布的对象**（`npm publish` 的 `files` 白名单、部署脚本、Docker 镜像都从它取件）；**它需要命名缓存策略**（带内容哈希的文件名如 `main.a1b2c3.js` 才能让浏览器长期缓存，HTML 引用最新哈希实现「更新即换名」）。

**常见误解**：把源码和产物搞混，或者为了让 CI 快一点而提交 `dist/`。看似省事，实际上会引入「有人改了源码忘了重新构建」的幽灵 bug，而且让 PR diff 淹没在几十万行生成代码里。

也见 [Bundler（打包器）](#bundler打包器)、[Release Process（发布流程）](#release-process发布流程)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

### Continuous Integration（持续集成）

持续集成（CI，Continuous Integration）指「每次推送代码后，由服务器自动执行一套校验流水线」，用机器代替人去确认「这份代码是好的」。典型任务序列是 `npm ci → lint → typecheck → test → build`，任何一步失败就在 PR 上给出明确的红叉。它的核心收益不是「跑得快」，而是**反馈前置**：把「合并后才发现坏了」变成「合并前就知道坏了」，配合分支保护规则，坏代码根本进不了主干。常见平台：GitHub Actions、GitLab CI、CircleCI、Jenkins。

**常见误解**：以为 CI 就是「自动跑测试」。跑测试只是其中一环；更大的价值在于**环境一致性**——CI 每次都从零安装依赖，因此能暴露「依赖我本机全局装的某个包」这类隐藏问题。

也见 [Pipeline（流水线）](#pipeline流水线)、[npm ci（npm ci）](#npm-cinpm-ci)、[Test Gate（测试门禁）](#test-gate测试门禁)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Pipeline（流水线）

流水线（pipeline）是 CI 里对「按顺序、分阶段执行的任务序列」的称呼，通常用声明式配置（如 GitHub Actions 的 YAML）描述。它的两个基本概念：**stage / job**（一个阶段，如 lint、test、build）和**step**（阶段内的一步命令）。流水线设计的关键是**并行与缓存**：互不依赖的 job 并行跑（lint 和 test 可以同时开始），`node_modules` 和构建缓存跨运行复用可以把几分钟压到几秒——但缓存必须用锁文件的哈希做 key，否则会用上过期依赖。质量工作流正是「本地毫秒级 → 提交前秒级 → CI 分钟级」这条分层的流水线。

**常见误解**：以为流水线越长越严格就越专业。每一步都要付出等待成本和维护成本；实践中遵循「快检查放前面、慢检查放后面」的排序原则（lint 几秒就失败，不该排在五分钟的测试后面）。

也见 [Continuous Integration（持续集成）](#continuous-integration持续集成)、[Git Hooks（Git 钩子）](#git-hooksgit-钩子)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Git Hooks（Git 钩子）

Git 钩子是 Git 在特定事件前后自动执行的脚本，放在 `.git/hooks/` 目录下（如 `pre-commit`、`commit-msg`、`pre-push`、`post-merge`）。**关键坑**：`.git/hooks/` **不进版本库**，直接在里面写脚本无法分享给团队。因此实践中用 **Husky** 这类工具：它把钩子安装动作挂到 `prepare` 生命周期脚本上，于是任何人 `npm install` 之后钩子自动就位，钩子脚本本体则作为普通文件提交进仓库。常见的钩子用途：提交前跑 lint-staged、提交信息校验（commitlint）、推送前跑完整测试。

**常见误解**：以为钩子是「强制」的。任何人都能 `git commit --no-verify` 绕过本地钩子，所以钩子的定位是**快速反馈**，真正的门禁必须放在 CI 上——两处都要有，各司其职。

也见 [pre-commit（pre-commit 钩子）](#pre-commitpre-commit-钩子)、[lint-staged（lint-staged）](#lint-stagedlint-staged)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### pre-commit（pre-commit 钩子）

`pre-commit` 是**在提交真正生成之前**触发的钩子，它的杀手级能力是：**只要脚本以非零状态退出，提交就被取消**。这使它成为「不让坏代码进历史」的第一道闸门。典型配置是在这里对**暂存区的文件**跑 lint、format 和受影响测试。设计要点：必须足够快（目标 1~3 秒），否则开发者会用 `--no-verify` 把它绕过去，钩子就形同虚设；因此这里只跑「对被改文件」的增量检查，全量检查留给 CI。

**常见误解**：在 pre-commit 里跑全量测试或全量构建。几十秒的等待会立刻让人养成绕过钩子的习惯，结果是「有钩子但没人用」，比没有钩子更糟。

也见 [Git Hooks（Git 钩子）](#git-hooksgit-钩子)、[lint-staged（lint-staged）](#lint-stagedlint-staged)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### lint-staged（lint-staged）

lint-staged 解决 pre-commit 里最实际的问题：**只对本次暂存（staged）的文件跑检查**。它自己读取 `git diff --cached --name-only`，按 glob 匹配分组，然后对每组执行配置的命令，并把**自动修复后的结果重新 `git add`** 回暂存区。配置形如 `{ "*.js": ["eslint --fix", "prettier --write"] }`。它与 Husky 是标准搭档：Husky 负责「什么时候跑」，lint-staged 负责「对哪些文件跑、跑完怎么回写」。

**常见误解**：以为 lint-staged 能提升检查速度的「算法」。它省时间靠的是**缩小输入范围**（只查改动文件），而不是更快的引擎；因此它**不能替代 CI 的全量检查**——一个文件单独看没问题，和别的改动合在一起仍可能出问题。

也见 [pre-commit（pre-commit 钩子）](#pre-commitpre-commit-钩子)、[ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Test Gate（测试门禁）

测试门禁指「把某类检查设为合并/发布的**硬性前置条件**」，不通过就不允许继续。它由三层共同实现：**本地**（编辑器提示、pre-commit 钩子）负责快速反馈；**CI**（`npm ci → lint → typecheck → test → build` 任一步非零退出即失败）负责权威判定；**平台分支保护规则**（required status checks、必需 review、禁止直推主干）负责让 CI 的失败真正产生阻断力。设计门禁的核心是**严重度分层**：什么级别的问题允许合并（warn）、什么绝不允许（error），以及是否要求覆盖率不下降。

**常见误解**：以为「CI 红了但可以手动 merge」是可接受的例外。门禁一旦被绕过就成了摆设；如果某条规则经常被绕过，正确做法是**降低它的严重度或删掉它**，而不是保留一条人人无视的红线。

也见 [Continuous Integration（持续集成）](#continuous-integration持续集成)、[Severity（严重度）](#severity严重度)、[Pipeline（流水线）](#pipeline流水线)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### Release Process（发布流程）

发布流程是「从代码合并到用户可用」这条链路的规范化：常见步骤是改版本号（或由 changesets 根据变更描述自动计算）→ 更新 CHANGELOG → 打 tag（如 `v1.4.0`）→ 触发 `npm publish` 或部署流水线 → 由 tag 上的钩子执行发布。配套的工程约束包括：发布必须从 CI 而非个人电脑执行（保证可复现、有审计记录），发布前必须跑全量测试（`prepublishOnly`），以及用 `npm publish --dry-run` 先预览会被打包哪些文件。版本号怎么涨由[语义化版本](#semantic-versioning语义化版本)决定。

**常见误解**：以为 `npm publish` 是个可以随手执行、出问题再 `unpublish` 的命令。npm 对已发布版本的撤销有严格限制（24 小时后基本无法撤回），而且一旦有项目依赖了它，撤销会直接破坏别人的构建——**发布是不可逆操作**。

也见 [Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)、[Lifecycle Scripts（生命周期脚本）](#lifecycle-scripts生命周期脚本)、[Build Artifact（构建产物）](#build-artifact构建产物)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

## 函数式编程

### Functional Programming（函数式编程）

函数式编程（FP，Functional Programming）是一种以**函数组合**为主要组织手段的编程范式，它的三条支柱是：**纯函数**（同样输入永远同样输出、无副作用）、**不可变数据**（不修改已有值，而是产生新值）、**函数是一等公民**（能当参数传、当返回值返回、存进变量）。它带来的实际收益不是「优雅」，而是**可推理性**：纯函数可以独立测试、可以安全缓存（memoize）、可以并行执行而不担心竞争、可以放心重构。JS 不是纯函数式语言，但它把 FP 需要的语言设施都配齐了（闭包、箭头函数、`map`/`filter`/`reduce`、展开语法），因此在工程里可以按需取用。

**常见误解**：以为 FP 要求「完全不用可变状态」或「必须用某个库」。真实项目里 FP 是**倾向性**的：把核心业务逻辑写成纯函数，把副作用挤到边界层，这个「函数式核心 + 命令式外壳」的混合做法才是最实用的形态。

也见 [Pure Function（纯函数）](#pure-function纯函数)、[Immutability（不可变性）](#immutability不可变性)、[Declarative and Imperative（声明式与命令式）](#declarative-and-imperative声明式与命令式)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Pure Function（纯函数）

纯函数满足两个条件：**相同输入永远得到相同输出**（不依赖时间、随机数、外部变量等可变状态），并且**不产生可观察的副作用**（不修改参数、不改全局、不写文件、不发请求、不打印）。第二个条件里最容易被忽略的是「不修改入参」——一个函数如果 `push` 了传进来的数组，它就不是纯的，因为调用方观察到了变化。纯函数的回报很直接：可以独立单元测试（不用 mock）、可以自由缓存（[Memoization（备忘录法）](#memoization备忘录法)）、可以任意重排和并行、出 bug 时只需要看函数体。

**常见误解**：以为「没有副作用」就等于「函数体内不能出现 `console.log`」。严格来说打印也是副作用，但工程上通常关心的是**会影响程序行为**的副作用；调试日志一般被宽容对待，关键是别让它成为逻辑的一部分。

也见 [Side Effect（副作用）](#side-effect副作用)、[Referential Transparency（引用透明）](#referential-transparency引用透明)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)、[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### Side Effect（副作用）

副作用是函数除了「返回值」之外**对外部世界造成的任何可观察影响**：改全局变量、修改入参、写 DOM、发网络请求、读写文件、打日志、改数据库、`Date.now()` / `Math.random()` 这类「读取环境」。注意最后这类是**读取**而非写入，但同样算副作用，因为它们让输出不再只由参数决定。FP 的立场不是「消灭副作用」（程序终究要影响世界），而是**隔离副作用**：让纯函数负责计算，把副作用推到程序的边界，并用容器（如 IO 函子）把它显式地表达出来。

**常见误解**：以为「不写文件、不请求」就没有副作用。修改一个传进来的对象是最常见也最隐蔽的副作用，它会让「我明明没改这个数组」变成排查半天的 bug。

也见 [Pure Function（纯函数）](#pure-function纯函数)、[Side-effect Isolation（副作用隔离）](#side-effect-isolation副作用隔离)、[IO Functor（IO函子）](#io-functorio函子)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### Referential Transparency（引用透明）

引用透明指「一个表达式可以被它的**结果值**替换，而程序行为不变」。它是纯函数带来的直接推论，也是 FP 里做等式推理的基础：既然 `add(1, 2)` 永远等于 `3`，那代码里任何地方都可以放心地把前者换成后者。实际价值体现在三处：**缓存**（结果可替换才谈得上记忆化）、**惰性求值**（不求值也不影响结果，才能推迟到需要时）、**并行**（可任意重排而不改变语义）。反过来，`Date.now()` 就没有引用透明性——把它换成某个具体数字会改变程序行为。

**常见误解**：把引用透明和「函数是纯的」当成同一件事。两者等价性很高（纯函数构成的表达式引用透明），但「引用透明」描述的是**表达式**的性质，「纯」描述的是**函数**的性质。

也见 [Pure Function（纯函数）](#pure-function纯函数)、[Lazy Evaluation（惰性求值）](#lazy-evaluation惰性求值)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Immutability（不可变性）

不可变性指「一个值创建之后就不再改变」——要「改」就基于原值创建一个新值。在 JS 里，`const` 只保证**绑定**不可变，不保证**对象内容**不可变，所以真正的手段有：`Object.freeze`（浅冻结）、展开语法 `{ ...obj, key: newValue }`、数组的 `toSorted`/`toReversed`/`toSpliced`/`with`（ES2023 新增的不可变版本）、`structuredClone`（深拷贝）。不可变性的收益是：共享引用不再有「谁改的」问题、变更可追溯（每次都是新对象，利于 diff 和撤销）、以及让 React 等框架能靠引用比较判断是否需要重新渲染。

**常见误解**：以为不可变就是「性能差」。朴素的全量深拷贝确实贵，但真正的实现靠的是[结构共享](#structural-sharing结构共享)——只复制路径上的节点，其余部分复用引用，因此代价是 O(log n) 而非 O(n)。

也见 [Persistent Data Structure（持久化数据结构）](#persistent-data-structure持久化数据结构)、[Structural Sharing（结构共享）](#structural-sharing结构共享)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`09_objects/09_freeze_seal.js`](09_objects/09_freeze_seal.js)

### Persistent Data Structure（持久化数据结构）

这里的「持久化」不是「存到磁盘」，而是指**旧版本在修改后依然可用**：对一个持久化数据结构做「修改」，会返回一个新版本，原版本保持不变，两个版本可以同时存在。这正是不可变数据在实现层面需要的性质。它和「临时性（ephemeral）数据结构」相对——后者的修改会就地改变原对象。持久化结构让「撤销/重做」「时间旅行调试」「并发快照」变得廉价：保留一堆历史版本只是一堆指针而已。

**常见误解**：把「持久化」理解成 `localStorage` 或数据库那层含义。在这个术语里，它描述的是**数据结构的版本语义**，与存储介质毫无关系。

也见 [Structural Sharing（结构共享）](#structural-sharing结构共享)、[Immutability（不可变性）](#immutability不可变性)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Structural Sharing（结构共享）

结构共享是让不可变数据变得**高效**的关键技术：创建新版本时，只复制**从根到被修改节点的那条路径**，未被触及的子树直接复用原版本的引用。在一个平衡树结构里，路径长度是 O(log n)，所以一次「修改」的代价是 O(log n) 而不是 O(n)，而且新旧两个版本共享绝大部分内存。它也是引用相等能当「没有变化」用的原因——React 的 `memo`、Redux 的 `useSelector` 都依赖这个性质做浅比较。

**常见误解**：以为「不可变 = 每次深拷贝」。用 `JSON.parse(JSON.stringify(obj))` 实现的不可变性能很差且丢失 `Date`/`undefined`/循环引用；库（Immutable.js、Immer）之所以存在，就是为了提供带结构共享的实现。

也见 [Persistent Data Structure（持久化数据结构）](#persistent-data-structure持久化数据结构)、[Immutability（不可变性）](#immutability不可变性)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### First-class Function（一等函数）

一等函数指「函数在语言里的地位和数字、字符串一样」：可以被赋给变量、作为参数传递、作为返回值返回、放进数组和对象。JS 从一开始就支持（这也是它被称为「披着 C 外衣的 Scheme」的原因）。一句话判据：**语言里凡是能出现「值」的地方，能不能写函数？** 能，就是一等函数。它是[高阶函数（Higher-order Function）](#higher-order-function高阶函数)和[函数组合（Function Composition）](#function-composition函数组合)能够成立的语言前提。

**常见误解**：把「一等函数」和「高阶函数」当同义词。前者是**语言特性**（函数是值），后者是**函数的一种用法**（接收或返回函数）。

也见 [Higher-order Function（高阶函数）](#higher-order-function高阶函数)、[Function Composition（函数组合）](#function-composition函数组合)。

示例：[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)、[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Higher-order Function（高阶函数）

高阶函数是**接收函数作为参数、或返回函数作为结果**的函数。它把「变化的部分」参数化，从而把「不变的结构」固化下来——`map`/`filter`/`reduce` 参数化的是「对每个元素做什么」，`once`/`debounce`/`memoize` 参数化的是「在被包装函数之外还要做什么」。它是复用代码的主力工具，但要注意它必然带来一层间接调用，在热点路径上可能影响性能（通常可忽略）。详细展开见函数分册与函数目录。

**常见误解**：以为用高阶函数「更函数式、更高级」。`arr.map(parseInt)` 这类经典陷阱正说明它需要更小心：`map` 会把 `(value, index, array)` 三个参数都传给回调，而 `parseInt` 的第二个参数是进制——这正是「会不会用」和「懂不懂」的分界。

也见 [First-class Function（一等函数）](#first-class-function一等函数)、[Currying（柯里化）](#currying柯里化)、[Function Composition（函数组合）](#function-composition函数组合)。

示例：[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)、[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)

### Function Composition（函数组合）

函数组合是把多个一元函数**串成一条链**，让上一步的输出成为下一步的输入：`(f ∘ g)(x) = f(g(x))`。它的价值在于**用小函数拼出复杂行为**——每个函数只干一件事、可单独测试、可任意重组，而组合结果读起来就像一段「数据流水线的说明书」。组合满足**结合律**（`f ∘ (g ∘ h)` 等于 `(f ∘ g) ∘ h`），所以怎么加括号都对，这是它能自由重构的数学保证。

**常见误解**：以为组合函数必须用库。两行代码 `const compose = (f, g) => x => f(g(x))` 就够；真正需要库的是「可变参数版本 + 类型定义」。

也见 [compose and pipe（compose与pipe）](#compose-and-pipecompose与pipe)、[Point-free Style（无参风格）](#point-free-style无参风格)。

示例：[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)、[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### compose and pipe（compose与pipe）

实现组合的两个函数，区别只在**数据流动方向**：`compose(f, g, h)` 返回 `x => f(g(h(x)))`——数学记法（从右向左读懂）；`pipe(f, g, h)` 返回 `x => h(g(f(x)))`——从左向右读，与书写顺序一致。因为 `pipe` 更符合阅读直觉（先做 f、再做 g），在实际代码里比 `compose` 更常用。两者都用 `reduce` 实现：`const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x)`。注意它们通常**只组合一元函数**——多参数函数要先柯里化才能塞进管道。

**常见误解**：把方向记反。记住口诀：**compose 是「从里往外读」，pipe 是「从左往右读」**——不确定时，写一个 `compose(a, b)(x)` 打印一下结果最快。

也见 [Function Composition（函数组合）](#function-composition函数组合)、[Currying（柯里化）](#currying柯里化)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)、[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)

### Point-free Style（无参风格）

「point」在 FP 术语里指**参数点位**，也就是 `x => f(x)` 里的那个 `x`。point-free（无参风格）指「代码里不出现那个参数名」，只描述**做什么变换**，把参数交给组合出来的函数隐式接收：`const inc = x => x + 1` 是有 point 的，`const inc = add(1)` 是无 point 的。它必须和**柯里化的工具函数**配合（`add(1)` 之所以能当一元函数用，是因为 `add` 是柯里化的）。好处是管道读起来清爽；代价是可读性会迅速下降——`compose(map(f), filter(g), reduce(h, 0))` 对不熟悉的人几乎天书。

**常见误解**：以为 point-free 是「函数没有参数」。它只是**不显式写出参数名**，运行时的参数一个都没少。另一个误解是认为它更「高级」——很多团队明确禁止过度 point-free，因为调试时看不到中间变量是真实痛点。

也见 [Eta Reduction（eta归约）](#eta-reductioneta归约)、[compose and pipe（compose与pipe）](#compose-and-pipecompose与pipe)、[Currying（柯里化）](#currying柯里化)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Eta Reduction（eta归约）

eta 归约是「当两侧语义等价时，把多余的参数包装去掉」的变换：`x => f(x)` 可以化简成 `f`，因为两者的行为完全一致。它是 point-free 风格背后的**推导规则**：`const double = arr => arr.map(x => x * 2)` 里，`x => x * 2` 已经无参数可去，但外层 `arr => arr.map(...)` 还可以写成 `compose(map(x => x * 2))`。做 eta 归约的前提是**两者真的等价**——如果 `f` 依赖 `this`、或者参数个数有语义（如 `parseInt` 的第二个参数是进制），化简就会改变行为。

**常见误解**：在 JS 里随意对方法做 eta 归约，最常见的就是 `arr.map(parseInt)`。`f` 作为回调时会收到 `(value, index, array)`，而 `x => parseInt(x)` 只用一个参数——两者不等价，必须显式写箭头函数。

也见 [Point-free Style（无参风格）](#point-free-style无参风格)、[Higher-order Function（高阶函数）](#higher-order-function高阶函数)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Functor（函子）

函子（Functor）是「**可以被 map 的东西**」。严格定义要求两件事：提供 `of` 方法把任意值装进容器（`F.of(x)`），并提供 `map` 方法接收函数 `f`、返回**同样结构的新容器**（`F.of(x).map(f)` 的结果仍然是一个 F，里面装着 `f(x)`）。关键心法是：**map 不改变容器的形状，只改变容器里装的值**。数组、`Promise`、`Maybe`、`Either` 都是函子——理解了「map 是「在容器内做变换」的通用接口」，就能看懂这一整套抽象。

**常见误解**：以为函子是个具体的类。它是一组**必须遵守的规则**（`of` + `map` + 两条函子定律），任何满足它的对象都是函子。另一个误解是把函子和[单子（Monad）](#monad单子)混为一谈：函子的 `map` 要求回调返回**普通值**，而单子的 `chain` 允许回调返回**同类型的容器**——这就是两者的分界线。

也见 [map（抽象映射）](#map抽象映射)、[Functor Laws（函子定律）](#functor-laws函子定律)、[Monad（单子）](#monad单子)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### Functor Laws（函子定律）

函子必须满足两条定律，它们不是「数学装饰」，而是**让重构变得安全**的保证。**恒等律（identity）**：`F.of(x).map(x => x)` 必须等价于 `F.of(x)`——map 一个原样返回的函数，不应该产生任何影响。**组合律（composition）**：`F.of(x).map(f).map(g)` 必须等价于 `F.of(x).map(x => g(f(x)))`——连续两次 map 可以合并成一次。组合律的实际价值在于**性能与重构**：既然两者等价，就可以把多次 `map` 融合成一次遍历（融合优化），或者放心地把 `map(f).map(g)` 拆开调试。

**常见误解**：以为定律是「理论上正确的废话」。违反定律的「函子」会造成真实的 bug：如果 `map` 会跳过 `undefined`（而不是老实调用），那么 `map(x => x)` 就不恒等，任何基于「map 不影响结构」的重构或优化都会出错。

也见 [Functor（函子）](#functor函子)、[Monad Laws（单子定律）](#monad-laws单子定律)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### map（抽象映射）

`map` 的抽象含义是：**在不改变容器结构的前提下，把容器里的值用函数变换一遍**，返回一个新容器。同一个名字，在不同容器上有不同的具体行为——数组的 `map` 逐元素变换、`Promise` 的 `then` 是「未来的 map」、`Maybe` 的 `map` 会在 `Nothing` 时短路、`Either` 的 `map` 只作用于 `Right`。理解这层抽象之后，「用 map 处理数组」只是它的一个特例，而 `Nothing.map(f)` 什么都不做也不再奇怪：**容器的形状决定了 map 遇到什么情况该跳过**。

**常见误解**：以为 `map` 是数组专有的方法。它是函子接口；另外要注意 `map` 的返回类型**永远是容器**，不会「拆开」——`[1,2,3].map(f)` 得到数组，`Maybe.of(1).map(f)` 得到 `Maybe`。想拆开或串联嵌套容器，那是 [flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain) 的职责。

也见 [Functor（函子）](#functor函子)、[flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`23_collections/01_map_basics.js`](23_collections/01_map_basics.js)

### Container（容器）

容器是函子抽象的形象说法：一个「盒子」，里面装着一个值，同时**附带一些额外的语境（context）**。数组的语境是「可能有 0 个或多个」、Maybe 是「可能没有」、Either 是「可能是错误」、Promise 是「可能还没算出来」、IO 是「是个副作用，还没执行」。容器的价值在于把**语境显式化**：以前靠 `if (x == null)` 和 `try/catch` 散布在代码里的判断，现在变成「值的类型」的一部分，可以由 `map`/`chain` 统一处理。

**常见误解**：以为容器必须是自定义类。数组就是最常见的容器，`Promise` 也是——它们是语言内置的函子，只是很多人没意识到自己一直在用。

也见 [Context（上下文）](#context上下文)、[Functor（函子）](#functor函子)、[Maybe（Maybe函子）](#maybemaybe函子)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`40_functional_programming/02_maybe.js`](40_functional_programming/02_maybe.js)

### Context（上下文）

上下文指容器除了「值」之外携带的那份额外信息——它决定了 `map` 的行为规则。数组的上下文是「多重性」（对每个元素做），Maybe 的上下文是「可能为空」（空则短路），Either 的上下文是「可能失败」（失败则短路并携带错误），Promise 的上下文是「异步与时间」，IO 的上下文是「延迟执行的副作用」。**同一个 `map`，不同上下文给出不同语义**，这正是函子抽象的精髓：变换值的动作被统一了，而处理语境的规则被封装在容器里。

**常见误解**：把这里的 context 和 React 的 `Context`（跨层传值的机制）或者 `this` 的「执行上下文」混为一谈。三者只是恰好共用了同一个英文单词，含义完全无关。

也见 [Container（容器）](#container容器)、[Functor（函子）](#functor函子)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### Maybe（Maybe函子）

Maybe 是「**值可能不存在**」这一语境的容器，有两种状态：`Just(value)`（有值）和 `Nothing`（没值，注意它**不是 `null`**，而是一个有身份的「空容器」）。它的核心规则是短路：`Just(x).map(f)` 得到 `Just(f(x))`，而 `Nothing.map(f)` 直接返回 `Nothing`，**回调根本不会被调用**。于是只要链上任何一环是 `Nothing`，后面所有 map 都自动跳过，最后用 `getOrElse(默认值)` 安全收尾。它替代的是「层层 `if (obj && obj.a && obj.a.b)`」这种防御式取值。

**常见误解**：以为 Maybe 就是「带判空的工具类」。它的真正意义是把**「可能没有」提升为类型的一部分**：拿到一个 Maybe 时，编译器/读者都知道「必须显式处理空的情况」，而不是靠人记得判空。另外 `Nothing` 和 `null` 的区别很关键——`Nothing` 可以被 map，`null` 会直接抛异常。

也见 [Either（Either函子）](#eithereither函子)、[Container（容器）](#container容器)、[Functor（函子）](#functor函子)。

示例：[`40_functional_programming/02_maybe.js`](40_functional_programming/02_maybe.js)

### Either（Either函子）

Either 是「**要么失败、要么成功**」的容器，两种状态为 `Left(error)`（失败，装着原因）和 `Right(value)`（成功，装着结果）。约定俗成称为**右偏（right-biased）**：`map`/`chain` 等操作只作用于 `Right`，`Left` 会自动短路。它和 Maybe 的唯一区别是：**Maybe 的失败是「空」，不携带信息；Either 的失败是一个值**，可以带上错误码、错误消息、出错字段、原始异常。因此需要「知道为什么失败」时用 Either，只需要「有没有值」时用 Maybe。

**常见误解**：以为 Either 是用来「替代 try/catch」的语法糖。它的立场更根本：**把错误从控制流变成数据**。`throw` 会让函数的返回类型说谎（声明返回 User，实际可能抛出），而 `Either<Error, User>` 把「可能失败」写进了返回值里，调用方无法忽略。

也见 [Maybe（Maybe函子）](#maybemaybe函子)、[Pattern Matching（模式匹配）](#pattern-matching模式匹配)、[Sum Type（和类型）](#sum-type和类型)。

示例：[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### IO Functor（IO函子）

IO 函子是「把副作用**包装成值**」的容器：`IO.of(() => ...)` 装的是一个**还没执行的动作**，`map` 组合的是这个动作的描述，直到调用 `run()`（或 `unsafePerformIO()`）才真正执行。它的核心思想是**把「描述」与「执行」分离**：整个程序可以先用纯函数拼装出一份「副作用的说明书」，最后在程序的最外层执行一次。这样副作用就被压缩到了极小的边界内，其余部分全部可测试、可推理。它也是理解更复杂的 `Effect`/`Task`/`ZIO` 类库的概念起点。

**常见误解**：以为 `IO.of(console.log('hi'))` 会延迟打印。`IO.of` 接收的是**已经求值的参数**，所以这行代码当场就打印了——正确写法是 `IO.of(() => console.log('hi'))`，包一个函数进去。这个陷阱（「急切求值 vs 惰性包装」）是 IO 函子最经典的坑。

也见 [Side Effect（副作用）](#side-effect副作用)、[Lazy Evaluation（惰性求值）](#lazy-evaluation惰性求值)、[Side-effect Isolation（副作用隔离）](#side-effect-isolation副作用隔离)。

示例：[`40_functional_programming/08_io_and_effects.js`](40_functional_programming/08_io_and_effects.js)、[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### Monad（单子）

单子（Monad）不是魔法，而是一个满足三件事的容器：① 有 `of` 把普通值装进去；② 有 `chain`（别名 `flatMap`/`bind`/`>>=`）接收「返回**同类型容器**的函数」，返回**容器**而不是容器的容器；③ 满足三条单子定律。一句话概括：**Monad = 函子（有 map）+ 能把嵌套容器拍平（有 chain）**。它解决的问题是：现实里的函数天然返回容器（查数据库可能返回 `Maybe`、解析可能返回 `Either`），而函子的 `map` 只接受返回普通值的回调，于是就会套出 `Maybe(Maybe(x))`，`chain` 正是用来把这一层压平的。

**常见误解**：把单子当成「高级模式」或「必须用库」。`Promise` 就是单子（`then` 即 `chain`），数组也是（`flatMap`），你已经天天在用了。另一个常见误解是问「单子有什么用」——它不增加能力，只是给「串联带语境的运算」提供了一个统一的接口。

也见 [Functor（函子）](#functor函子)、[flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)、[Monad Laws（单子定律）](#monad-laws单子定律)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### flatMap and chain（flatMap与chain）

`chain`（也叫 `flatMap`、`bind`、`>>=`）是单子的核心方法：它接收一个「返回同类型容器」的函数，把结果**压平一层**。对比就清楚了：`Just(3).map(x => Just(x + 1))` 得到 `Just(Just(4))`（嵌套两层），而 `Just(3).chain(x => Just(x + 1))` 得到 `Just(4)`（一层）。JS 里数组的 `flatMap` 就是这个操作（`map` 后 `flat(1)`），而 `Promise.prototype.then` 是它最广为人知的形式——`then` 会识别回调返回的 Promise 并自动摊平，所以 `p.then(f).then(g)` 不会套出 `Promise<Promise<T>>`。

**常见误解**：把 `chain` 当成「更强的 map」而到处替换。规则很简单：**回调查看是否返回容器**——返回普通值用 `map`，返回容器用 `chain`。全用 `chain` 也能跑（单子定律保证 `chain(x => M.of(f(x)))` 等价于 `map(f)`），但会多包一层无意义的 `of`。

也见 [map（抽象映射）](#map抽象映射)、[Monad（单子）](#monad单子)、[Flattening Nested Functors（嵌套函子的压平）](#flattening-nested-functors嵌套函子的压平)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### of and return（of与return）

`of`（Haskell 里叫 `return`，与「函数返回」无关）是把**任意普通值装进容器**的「最小构造器」：`Maybe.of(1)` 得到 `Just(1)`，`Either.of(1)` 得到 `Right(1)`，`Promise.resolve(1)` 得到已兑现的 Promise，`[1]` 是数组的 `of`。它的存在让代码可以**不依赖具体容器类型**地工作——一段只用到 `of` 和 `chain` 的逻辑，换成 Maybe 还是 Either 都能跑，这就是「面向单子编程」。`of` 也是三条单子定律里出现次数最多的那个符号。

**常见误解**：`of` 会「做点什么」。它只包装，不做判断——`Maybe.of(null)` 得到的是 `Just(null)` 而不是 `Nothing`，这是很常见的困惑。要处理空值，得用专门的构造函数，比如 `Maybe.fromNullable(value)`。

也见 [Monad（单子）](#monad单子)、[Monad Laws（单子定律）](#monad-laws单子定律)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)、[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### Monad Laws（单子定律）

单子除了函子两定律之外还要满足三条定律，它们保证 `chain` 的行为「没有意外」。**左单位律**：`M.of(a).chain(f)` 等价于 `f(a)`——用 `of` 包一层再 chain，等于直接调用 f，说明 `of` 是「最中性的包装」。**右单位律**：`m.chain(M.of)` 等价于 `m`——chain 一个「只是包起来」的函数等于什么都没做。**结合律**：`m.chain(f).chain(g)` 等价于 `m.chain(x => f(x).chain(g))`——连续两次 chain 可以合并成一次，怎么加括号都对。结合律是最有实际价值的一条：它让 `Promise` 的 `p.then(f).then(g)` 可以安全地重写成 `p.then(x => f(x).then(g))`，也让编译器/库里能做扁平化优化。

**常见误解**：以为定律是「形式主义」。违反定律会造成真实后果：如果 `Promise` 不满足结合律，那 `then` 链的重构和错误传播就不可靠——正是因为满足了，我们才敢把任意一段 `then` 链抽成函数。

也见 [Monad（单子）](#monad单子)、[Functor Laws（函子定律）](#functor-laws函子定律)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### Flattening Nested Functors（嵌套函子的压平）

这是 `chain` 存在的**唯一理由**。问题的来源：`map` 的签名决定了它只能「把值变成新值」，如果你传进去的函数本身就返回容器（如 `findUser` 返回 `Maybe`），`map` 会老实地把整个容器当作值装进去，结果就成了 `Maybe(Maybe(User))`——两层。而两层 `Maybe` 是没法直接用 `map` 取值的：外层 `map` 拿到的内层容器，你还得再 map 一次，于是每多一步操作就多套一层。`chain` 的做法是：调用 f 拿到内层容器后，**只保留内层，丢掉外层的包装**，把深度恒定为 1。JS 里 `Array.prototype.flatMap` 就是这个操作的数组版本（等价于 `map` + `flat(1)`）。

**常见误解**：以为嵌套是「写错了」。它是类型系统下必然出现的结果，不是 bug；正确的应对是**在该用 chain 的地方用 chain**（判据：回调的返回值是不是容器）。另外 `flatMap` 只压平**一层**，三层嵌套要连用两次 chain。

也见 [flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)、[Monad（单子）](#monad单子)、[map（抽象映射）](#map抽象映射)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### do Notation（do记法）

do 记法是 Haskell 提供给单子的**语法糖**，目的只有一个：把 `m.chain(a => f(a).chain(b => g(a, b).chain(c => ...)))` 这种不断缩进的嵌套写法，拉平成一段**看起来像命令式的顺序代码**：`do { a <- f; b <- g(a); c <- h(a,b); return ... }`。它的关键性质是「每一行都隐式地 chain 了上一行」，所以**语境会自动传递和短路**——中间任何一步返回 `Nothing`/`Left`，后面所有行直接跳过。

JS 没有 do 记法，但 `async`/`await` 就是 Promise 单子的 do 记法：`await` 相当于 `<-`，`return` 相当于 `of`。所以「async 函数里可以用同步的写法写异步」这件事，本质上是「Promise 是个单子 + await 是它的语法糖」。

**常见误解**：以为 `async`/`await` 是全新的语言机制。它只是 Promise 单子的语法糖——这也解释了为什么 `await` 能自动摊平嵌套（`await` 一个 Promise 得到的是它兑现的值而不是 Promise），因为摊平正是 chain 的语义。

也见 [Monad（单子）](#monad单子)、[flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### Algebraic Data Type（代数数据类型）

代数数据类型（Algebraic Data Type，ADT）是「**用类型来描述数据的形状**」的一整套做法，名字里的「代数」来自它用组合方式构造类型：最基本的两种构造是**积类型**（「同时具备 A 和 B」，可能性个数相乘）和**和类型**（「要么是 A，要么是 B」，可能性个数相加）。它和模式匹配是天生一对：用和类型定义「有哪几种情况」，用模式匹配穷尽地处理每一种，让「漏了某种情况」变成编译期错误。JS 没有原生 ADT，但可以用标签联合 + 解构手工模拟。

**常见误解**：以为 ADT 是「抽象数据类型（Abstract Data Type）」的缩写。两者是完全不同的概念：ADT 在这里指**代数**数据类型（和类型/积类型），抽象数据类型指的是「封装了表示的接口」，如栈、队列。

也见 [Product Type（积类型）](#product-type积类型)、[Sum Type（和类型）](#sum-type和类型)、[Pattern Matching（模式匹配）](#pattern-matching模式匹配)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Product Type（积类型）

积类型表示「**同时具备 A 和 B**」，它的取值个数是各部分个数之**积**（所以叫积类型）。对象 `{ name, age }`、元组 `[x, y]`、类实例、带多个字段的记录都是积类型。JS 里的积类型就是对象和解构——这是语言原生支持得最好的部分。关键认识：积类型只能表达「都有」，表达不了「二选一」；要表达「要么这样要么那样」，必须用[和类型](#sum-type和类型)。

**常见误解**：以为字段可选（`{ a?: number }`）就成了和类型。可选字段只是「值可能是 `undefined`」，仍然是一个积类型（`A × (B | undefined)`），它的组合数确实变了，但结构性质还是「所有字段共存」——真正的和类型需要能区分「是哪一种情况」。

也见 [Sum Type（和类型）](#sum-type和类型)、[Algebraic Data Type（代数数据类型）](#algebraic-data-type代数数据类型)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Sum Type（和类型）

和类型表示「**要么是 A，要么是 B**」，取值个数是各部分个数之**和**。它也叫标签联合（tagged union）、可辨识联合（discriminated union）、变体（variant）。JS 里的典型写法是「带 `type` 判别字段的对象」：`{ type: 'loading' } | { type: 'success', data } | { type: 'error', message }`——每个分支携带的数据不同，靠 `type` 字段区分。它是「状态机」和「异步结果」的天然建模方式，比「一堆可空字段 + 布尔标志」清晰得多（后者会产生大量非法状态，比如 `isLoading && isError` 同时为真）。

**常见误解**：以为用 `null` 或错误码就等价于和类型。`{ data: null, error: null, loading: false }` 这种「万能对象」允许非法组合存在；和类型的价值正是**让非法状态无法表示**。

也见 [Tagged Union（标签联合）](#tagged-union标签联合)、[Product Type（积类型）](#product-type积类型)、[Either（Either函子）](#eithereither函子)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Tagged Union（标签联合）

标签联合是 sum type 在**不支持原生和类型的语言**里的实现手法：用一个显式的**标签字段**（惯用名是 `type`、`tag`、`kind`）记录「当前是哪一种情况」，其余字段是该情况的数据。这就是 JS / TypeScript 里的标准做法，也是 [Either（Either函子）](#eithereither函子) 里 `Left`/`Right` 的实现基础。加上 TypeScript 的可辨识联合后，`switch (x.type)` 能自动把类型收窄到对应分支，从而得到穷尽性检查的效果。

**常见误解**：以为标签字段值可以随便是 `0`/`1`/`2` 或布尔。可辨识联合的前提是**标签必须是字面量类型**（字符串或数字字面量），用宽泛的 `string` 类型会让类型收窄失效——这是 TS 里最常见的「联合类型没生效」原因。

也见 [Sum Type（和类型）](#sum-type和类型)、[Pattern Matching（模式匹配）](#pattern-matching模式匹配)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Pattern Matching（模式匹配）

模式匹配是「**按数据的形状分支处理，并同时把数据拆开**」的能力，可以理解为「加强版的 `switch` + 解构」。真正让它与众不同的是**穷尽性检查（exhaustiveness checking）**：编译器能验证你是否处理了所有情况，漏掉一种就报错。这在状态机、异步结果、AST 处理这类「分支必须覆盖全」的场景里价值巨大。

**现状说明**：JavaScript **至今没有原生模式匹配**（相关的 TC39 提案——Pattern Matching 提案——仍在推进中，尚未进入标准），所以本仓库的示例只能用 `switch (x.type)` + 解构、配合一个 `assertNever` 兜底函数来手工模拟穷尽性检查；TypeScript 的可辨识联合能提供**编译期**的穷尽性校验，是目前最接近原生体验的做法。

**常见误解**：以为 `switch` 就是模式匹配。差别在「穷尽性」和「能否拆解」：`switch` 不检查漏分支，也不能在分支条件里直接解构出数据；此外真·模式匹配还支持嵌套模式和守卫条件。

也见 [Tagged Union（标签联合）](#tagged-union标签联合)、[Sum Type（和类型）](#sum-type和类型)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Lazy Evaluation（惰性求值）

惰性求值指「**表达式在真正需要它的值时才计算**」，与之相对的是 JS 默认的**及早求值（eager evaluation）**。它的三大好处：可以表示和操作**无限序列**（如「所有自然数」）、可以**避免不必要的计算**（`cond ? a() : b()` 只算一个分支）、以及可以把「计算」当作值来传递和组合（[IO 函子](#io-functorio函子)就是靠这个把副作用描述成值）。JS 没有内置的惰性求值语义，但提供了几个实现手段：把计算包进**函数**（`() => expensive()`）、用 **generator**（`function*` 天然按需产出）、以及 `Promise`（本身就是延迟执行的结果）。

**常见误解**：以为惰性总是更好。惰性会带来内存泄漏（闭包持有不再需要的引用）、难以调试的求值时机、以及「什么时候才真的执行」的不确定性。JS 生态里的普遍结论是：**默认及早，需要时局部惰性**。

也见 [IO Functor（IO函子）](#io-functorio函子)、[Referential Transparency（引用透明）](#referential-transparency引用透明)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### Currying（柯里化）

柯里化把「接收 n 个参数的函数」改造成「每次只收一个参数、返回下一个函数」的链：`add(1, 2)` 变成 `add(1)(2)`。它的实际价值不在于「少写几个参数」，而在于**部分应用**：`const add10 = add(10)` 得到一个「预设了第一个参数」的新函数，因此可以塞进 `pipe`/`compose` 的管道（管道只接受一元函数）。所以「柯里化」和「point-free」是配套的两件事：工具函数柯里化之后，才能写出无参风格。详细展开见函数分册。

**常见误解**：把柯里化和「部分应用（partial application）」当同义词。柯里化是**固定的一元化变换**（n 个参数变成 n 层嵌套），部分应用是「先填几个参数」这个更宽泛的概念——很多库（如 lodash 的 `partial`）提供的是后者。

也见 [Point-free Style（无参风格）](#point-free-style无参风格)、[Function Composition（函数组合）](#function-composition函数组合)、[Higher-order Function（高阶函数）](#higher-order-function高阶函数)。

示例：[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)、[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Side-effect Isolation（副作用隔离）

副作用隔离是 FP 在真实项目里的**落地策略**：不追求「消灭副作用」，而是把它挤到程序的边界，让核心逻辑保持纯净。具体做法通常是**函数式核心 + 命令式外壳（functional core, imperative shell）**：所有业务规则、计算、转换写成纯函数；IO（请求、读写、日志、时间、随机）集中在少数几个边界函数里，由它们调用纯函数、再把结果交给下一个副作用。收益是分层清晰：核心逻辑用普通单元测试就能覆盖（不需要 mock），副作用层虽然难测但代码量极少。更进阶的做法是用 IO 函子、Effect 系统把副作用变成可组合的数据结构。

**常见误解**：以为隔离副作用是为了「纯粹」或「好看」。真正的动机是**可测试性和可推理性**：一个混了 `fetch` 和日期计算的函数，测试要先起 mock server 再假装系统时间，而拆开之后每一半都变得平凡。

也见 [Side Effect（副作用）](#side-effect副作用)、[Pure Function（纯函数）](#pure-function纯函数)、[IO Functor（IO函子）](#io-functorio函子)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### Declarative and Imperative（声明式与命令式）

**命令式**描述「**怎么做**」：一步一步的操作序列（先建空数组，再循环，再 push，再返回）——JS 里 `for` 循环是最典型的形态。**声明式**描述「**要什么**」：把意图直接表达出来，由底层决定怎么执行——`arr.filter(isEven).map(double)` 只说「留下偶数、翻倍」，不说循环和下标。声明式的好处是不变量（循环下标、临时变量、边界条件）被抽象掉了，代码更短、更少出错点，也更容易被优化（库/引擎可以在不改变语义的前提下改变执行策略，如并行、短路、融合）。函数式编程整体上是一种声明式风格。

**常见误解**：以为声明式「一定更快」或「一定更慢」。一般情况下两者性能相当（引擎对高阶函数优化得不错），但命令式在极端热路径上仍可能因为「一次遍历 vs 三次遍历」「避免闭包分配」而更快。取舍的真正依据是**可读性与出错概率**，不是微性能。

也见 [Functional Programming（函数式编程）](#functional-programming函数式编程)、[Higher-order Function（高阶函数）](#higher-order-function高阶函数)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)、[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)
