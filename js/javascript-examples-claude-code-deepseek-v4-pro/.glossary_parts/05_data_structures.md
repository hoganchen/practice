## 数组（Array）

### Array（数组）

数组是**有序、可变、以整数下标访问**的容器，但它的真实身份是「一种特殊对象」：下标被转成字符串当作属性键存储，另有一个被引擎特殊对待的 `length` 属性。元素类型可以任意且允许混合（`[1, 'a', null, []]`），长度动态增长，没有容量上限（到 2³²-1 为止）。关键细节：`typeof []` 返回 `'object'` 而不是 `'array'`，所以判断数组必须用 `Array.isArray()`（跨 iframe 也可靠，`instanceof Array` 则不可靠）。另一个高频坑是构造：`new Array(3)` 造出的是**3 个空洞的稀疏数组**，而不是 `[3]`，想要单元素数组要写 `[3]` 或 `Array.of(3)`。数组适合「有序列表 + 按下标随机访问」；若需要按任意键查找或频繁删除中间元素，应该换成 `Map`/`Set`（见 `23_collections/`）。

也见 [Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)、[Array-like Object（类数组对象）](#array-like-object类数组对象)。

示例：[`08_arrays/01_create_and_access.js`](08_arrays/01_create_and_access.js)

### Array-like Object（类数组对象）

类数组对象指**有 `length` 属性、有数字下标，但不是数组**的对象，典型代表是 `arguments`、DOM 的 `NodeList`/`HTMLCollection`、字符串。它们最大的特点是「看起来像数组，但没有数组的方法」——没有 `map`、`filter`、`push`，直接调用会抛 `TypeError`。要转成真数组，用 `Array.from(x)`（推荐，能同时做映射）、`[...x]`（要求对象可迭代）或 `Array.prototype.slice.call(x)`（老写法）。关键区分点：**可迭代的类数组**（`NodeList`、`arguments`、字符串）能被展开运算符直接展开，而**只有 length 没有 `Symbol.iterator`** 的对象（手写的 `{0:'a', length:1}`）只能用 `Array.from`。

也见 [Array.from, Array.of（数组构造）](#arrayfrom-arrayof数组构造)、[Iterable Destructuring（可迭代对象解构）](#iterable-destructuring可迭代对象解构)。

示例：[`08_arrays/01_create_and_access.js`](08_arrays/01_create_and_access.js)

### Array.from, Array.of（数组构造）

两个静态方法解决 `new Array()` 的两个老问题。`Array.from(可迭代或类数组, mapFn?)` 把任何可迭代对象或类数组转成真数组，可选第二参数就地做映射（等价于 `[...x].map(f)` 但少一次遍历）。`Array.of(...items)` 按参数逐个构造数组，专治 `new Array(3)` 的歧义：`Array.of(3)` 得到 `[3]`，而 `Array.from({length: 3})` 得到 `[undefined, undefined, undefined]`（**密集**的真 undefined，不是空洞）。关键细节：`Array.from` 会把稀疏数组的空洞**填成真 `undefined`**，这一点和展开运算符一致，而 `Array.prototype.slice` 会保留空洞。

也见 [Array-like Object（类数组对象）](#array-like-object类数组对象)、[Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)。

示例：[`08_arrays/01_create_and_access.js`](08_arrays/01_create_and_access.js)、[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### Sparse Array and Hole（稀疏数组与空洞）

稀疏数组不是「元素值是 `undefined`」，而是「**这个下标根本没有对应的属性**」，这个缺失的位置叫空洞（hole）。区分方法很直接：`const a = new Array(3)` 后 `0 in a` 是 `false`（空洞），而 `[undefined, undefined, undefined]` 的 `0 in b` 是 `true`（真的有值）。这个区别会**静默改变方法行为**：`forEach`/`map`/`filter`/`some`/`every`/`reduce`/`indexOf` 会**跳过空洞**（内部按属性存在性遍历），而 `find`/`findIndex`/`findLast`/`includes` 按取值处理、**不跳过**——于是 `[1, , 3].indexOf(undefined)` 是 `-1`，但 `[1, , 3].includes(undefined)` 却是 `true`。此外 `join`/`toString` 把空洞当空串，`JSON.stringify` 把它变成 `null`，`[...arr]` 和 `Array.from` 把它变成真 `undefined`。

**常见误解**：以为「稀疏数组和填了 `undefined` 的数组是一回事」——几乎所有「同一个数组不同方法给出不同结果」的困惑都源于此。

也见 [Array length（数组的 length 属性）](#array-length数组的-length-属性)、[delete Operator and Array（delete 与数组）](#delete-operator-and-arraydelete-与数组)。

示例：[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### Array length（数组的 length 属性）

`length` 不是普通属性，而是引擎维护的「**最大下标 + 1**」的魔法属性，并且**可写**：写它会直接改变数组结构。`arr.length = 2` 会**截断**（删掉下标 2 及之后的元素，是可变操作）；`arr.length = 5` 会**扩展**并把新增位置填成空洞；`arr.length = 0` 是清空数组的常用手法。非法值会抛 `RangeError`：负数、小数（如 `2.5`）、超过 2³²-1 的数。另一个要点是 `delete arr[i]` 只删属性、**不改变 length**，那个位置会变成空洞——它不是 `splice`（不前移），也不是 `pop`（不缩短），日常几乎总是错的写法。

也见 [Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)、[splice（拼接）](#splice拼接)。

示例：[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### delete Operator and Array（delete 与数组）

`delete arr[1]` 删除的是「下标 1 这个属性」，而不是「把元素摘出去」：数组 `length` **保持不变**，被删的位置变成空洞，后面的元素**不会前移**。这几乎永远不是你想要的效果——想按位置删除并前移用 `splice(i, 1)`，想删末尾用 `pop()`，想删首位用 `shift()`，想按值删除用 `filter`。`delete` 真正合适的场合是删除**对象的属性**（但同样会把属性变成「不存在」，而不是置为 `undefined`）；而对数组和 `Map`/`Set` 用 `delete` 就是典型的误用。

也见 [splice（拼接）](#splice拼接)、[Array length（数组的 length 属性）](#array-length数组的-length-属性)。

示例：[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### Mutating vs Non-mutating Methods（可变方法与不可变方法）

数组方法按「是否修改原数组」分成两派，这是数组 API 里最容易出错的一条分界线。**可变（mutating）**：`push`/`pop`/`shift`/`unshift`/`splice`/`sort`/`reverse`/`fill`/`copyWithin`；**非可变（non-mutating）**：`slice`/`concat`/`join`/`map`/`filter`/`reduce`/`flat`/`find`/`some`/`every`/`indexOf`/`includes`/`at`/`keys`/`values`/`entries`。关键细节：`sort` 和 `reverse` 的「可变」身份最容易被忘记，很多人以为它们在返回新数组，实际上原数组已被打乱；在 React 等依赖引用比较的框架里，这直接导致「改了状态但界面不更新」。ES2023 为这四个可变方法补齐了不可变版本（`toSorted`/`toReversed`/`toSpliced`/`with`）。

也见 [Array Copying Methods（数组拷贝方法）](#array-copying-methods数组拷贝方法)、[Chaining（链式调用）](#chaining链式调用)。

示例：[`08_arrays/02_push_pop_shift_unshift.js`](08_arrays/02_push_pop_shift_unshift.js)、[`08_arrays/13_reverse_and_fill.js`](08_arrays/13_reverse_and_fill.js)

### push, pop, shift, unshift（首尾增删）

四个「往两端加/减一个元素」的可变方法，都会修改原数组并返回不同东西：`push(...items)` 尾部添加、返回**新长度**；`pop()` 尾部删除、返回**被删元素**（空数组返回 `undefined`）；`unshift(...items)` 头部添加、返回**新长度**；`shift()` 头部删除、返回**被删元素**。关键细节：`push`/`pop` 是 O(1)，而 `unshift`/`shift` 需要**整体搬移所有元素**，是 O(n)——在循环里对大队列反复 `shift` 会退化成 O(n²)，这时应改用 `Map`、索引指针或专门的队列结构（见 `23_collections/`）。另外这四个方法都**不跳过空洞**，对稀疏数组操作的是位置本身。

也见 [splice（拼接）](#splice拼接)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)。

示例：[`08_arrays/02_push_pop_shift_unshift.js`](08_arrays/02_push_pop_shift_unshift.js)

### slice（切片）

`arr.slice(start, end)` 返回一个**新的浅拷贝子数组**，含 `start`、不含 `end`，不修改原数组。两个参数都可省略：`slice()` 是整体浅拷贝，`slice(1)` 从下标 1 到末尾。负数下标表示「从末尾倒数」：`slice(-2)` 取最后两个，`slice(1, -1)` 去掉首尾各一个。关键细节：`start >= end` 时返回空数组（**不会自动交换参数**，这一点与字符串的 `substring` 相反）；参数是小数会先 `trunc`，`NaN` 当作 0。它的拷贝是**浅拷贝**，元素若为对象则新旧数组共享同一批引用。

**常见误解**：把 `slice` 当成「删除」——它从不修改原数组；想删除请用 `splice`。

也见 [splice（拼接）](#splice拼接)、[slice, substring, substr（子串截取）](#slice-substring-substr子串截取)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`08_arrays/03_slice.js`](08_arrays/03_slice.js)

### splice（拼接）

`arr.splice(start, deleteCount, ...items)` 是数组里**唯一能任意位置增删**的方法，它**修改原数组**并返回「被删除元素组成的新数组」。语义是「从 `start` 开始删掉 `deleteCount` 个，再在同样位置插入 `...items`」：`splice(i, 1)` 删一个，`splice(i, 0, x)` 纯插入，`splice(0)` 清空并拿到全部旧元素。关键细节：省略 `deleteCount` 表示「从 `start` 删到末尾」；`start` 可为负（从末尾数）；返回值**永远是被删的元素**，不是剩余数组，这是最常见的误解。与 `slice` 只差一个字母但语义完全相反——`slice` 只读不写、`splice` 只写（用返回值读）。

也见 [slice（切片）](#slice切片)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)。

示例：[`08_arrays/04_splice.js`](08_arrays/04_splice.js)

### concat（连接）

`arr.concat(a, b, ...)` 把数组或单个值**拼成一个新数组**返回，不改原数组，也不改变任何输入。参数里的数组会被**展开一层**（不是递归展平），非数组值直接追加；`concat` 会保留稀疏数组的空洞。它是 ES6 之前的主力拼接手段，如今更推荐 `[...a, ...b]`（更短、语义直观），但 `concat` 有一个独门能力：**能正确处理「值是数组或不是数组」两种情况**——`[].concat(x)` 无论 `x` 是 `[1,2]` 还是 `1`，都能得到一个数组，这在写兼容多种输入的 API 时非常有用（`Array.prototype.flat` 的深度也仅一层，不要混淆）。

也见 [Object Spread（对象展开）](#object-spread对象展开)、[flat, flatMap（扁平化）](#flat-flatmap扁平化)。

示例：[`08_arrays/05_concat_and_join.js`](08_arrays/05_concat_and_join.js)

### join（连接成字符串）

`arr.join(separator)` 把每个元素转成字符串后用分隔符连成一个字符串，默认分隔符是 `","`（**不是空串**，这是常见误判）。它不修改原数组，是「数组 → CSV / 展示文本 / 路径」的标准手段。关键细节：`null` 和 `undefined` 元素会被转成**空字符串**（不是 `"null"`），这也是「用 `join` 实现 `repeat`」这种小技巧的基础（`new Array(n+1).join('*')`）；稀疏数组的空洞同样按空串处理。实际写 CSV 时要注意元素自身含分隔符、引号需要转义，`join` 不做任何转义。

也见 [split（分割）](#split分割)、[String（字符串）](#string字符串)。

示例：[`08_arrays/05_concat_and_join.js`](08_arrays/05_concat_and_join.js)

### indexOf, lastIndexOf（索引查找）

`arr.indexOf(value, fromIndex?)` 用**严格相等（`===`）**逐个比较，返回第一个匹配的下标，找不到返回 `-1`；`lastIndexOf` 从右往左找。关键限制有三条：一是**不能查 `NaN`**（因为 `NaN === NaN` 为假，`[NaN].indexOf(NaN)` 是 `-1`）；二是**不能查找对象内容**，只比较引用，`[{a:1}].indexOf({a:1})` 永远是 `-1`；三是**跳过稀疏数组的空洞**，所以 `[1, , 3].indexOf(undefined)` 返回 `-1`，而同场景的 `includes` 返回 `true`。返回值必须是 `-1` 而不是 `0` 或 falsy 判断，写成 `if (arr.indexOf(x))` 会在下标 0 处出错。

也见 [includes（包含判断）](#includes包含判断)、[find, findIndex, findLast, findLastIndex（查找）](#find-findindex-findlast-findlastindex查找)。

示例：[`08_arrays/06_index_of_and_includes.js`](08_arrays/06_index_of_and_includes.js)

### includes（包含判断）

`arr.includes(value, fromIndex?)` 返回布尔值，是「数组里有没有这个值」的首选写法。与 `indexOf` 的关键区别有两个：它使用 **SameValueZero** 比较，因此**能查到 `NaN`**（`[NaN].includes(NaN)` 为 `true`）；它**不跳过稀疏数组的空洞**，把空洞当 `undefined`（`[1, , 3].includes(undefined)` 为 `true`）。它依旧只做**引用比较**，不能按内容判断对象是否在数组里——那要用 `find`/`some` 或先映射成原始值。只关心「是否存在」时用 `includes`，需要下标时才用 `indexOf`。

也见 [indexOf, lastIndexOf（索引查找）](#indexof-lastindexof索引查找)、[some, every（存在与全称判断）](#some-every存在与全称判断)。

示例：[`08_arrays/06_index_of_and_includes.js`](08_arrays/06_index_of_and_includes.js)

### find, findIndex, findLast, findLastIndex（查找）

这四个方法接收**判断函数**而不是值，用于按条件查找：`find` 返回第一个满足条件的**元素**（找不到返回 `undefined`），`findIndex` 返回它的**下标**（找不到返回 `-1`）；`findLast`/`findLastIndex`（ES2023）从右往左找第一个匹配项，写「取最后一条待处理记录」时比先 `reverse` 再 `find` 干净得多。关键细节：回调签名是 `(element, index, array)`，可以在回调里用下标做判断；它们在找到第一个匹配后**立即停止遍历**（短路），因此对「大数组里查少数几个」比 `filter` 高效；与 `indexOf` 不同，它们**不跳过稀疏数组的空洞**，会把空洞当 `undefined` 交给回调。

也见 [filter（过滤）](#filter过滤)、[Callback Signature Pitfall（回调签名陷阱）](#callback-signature-pitfall回调签名陷阱)。

示例：[`08_arrays/06_index_of_and_includes.js`](08_arrays/06_index_of_and_includes.js)、[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### forEach（遍历）

`arr.forEach(callback)` 只是**遍历**：对每个元素调用一次回调，返回值恒为 `undefined`，并且**无法中途 `break`**（用 `return` 只能跳过本次迭代，相当于 `continue`）。因此它表达的是「为每一项做一件事」这种副作用操作，而不是「算出新数组」。它**跳过稀疏数组的空洞**（回调不会被空洞调用）。如果需要中途退出，应该用 `for...of`、`some`/`every`（靠返回 `true`/`false` 提前终止）或 `find`。回调签名是 `(element, index, array)`，第三个参数是原数组本身。

**常见误解**：以为 `forEach` 能像 `map` 一样收集结果——`const r = arr.forEach(f)` 得到的 `r` 永远是 `undefined`。

也见 [map（映射）](#map映射)、[Chaining（链式调用）](#chaining链式调用)。

示例：[`08_arrays/07_forEach.js`](08_arrays/07_forEach.js)

### map（映射）

`arr.map(callback)` 对每个元素调用回调，用**返回值**组成一个**等长新数组**，原数组不变。它是声明式数据变换的主力：一个元素进、一个元素出，个数绝不改变——如果你在回调里写 `if (...) return;`，对应位置会得到一个 `undefined` 而不是「被跳过」，这通常意味着你该用 `filter` 或 `flatMap`。关键细节：回调签名是 `(element, index, array)`；它**跳过稀疏数组的空洞**，且结果数组**保留空洞**；由于是浅拷贝，返回的新数组与原数组共享元素引用（改对象元素两边都会变）。另外 `map` 只接收一个参数时不能直接用 `parseInt` 之类的多参函数。

也见 [forEach（遍历）](#foreach遍历)、[Callback Signature Pitfall（回调签名陷阱）](#callback-signature-pitfall回调签名陷阱)、[flat, flatMap（扁平化）](#flat-flatmap扁平化)。

示例：[`08_arrays/08_map.js`](08_arrays/08_map.js)

### filter（过滤）

`arr.filter(predicate)` 用判断函数筛出满足条件的元素，返回**新数组**（长度 ≤ 原长度），原数组不变。回调返回真值即保留，返回假值即丢弃；签名是 `(element, index, array)`。关键细节：它**跳过空洞**；返回的是**浅拷贝**（元素引用共享）；`filter` 的结果可直接链式接 `map`/`reduce`。一个高频陷阱是用 `filter(x => x)` 做「去假值」，这会连 `0`、`''`、`false` 一起删掉——想只去 `null`/`undefined` 要写 `filter(x => x != null)`。另一个常见用途是「按值删除数组元素」，因为 JS 没有 `remove` 方法。

也见 [map（映射）](#map映射)、[Chaining（链式调用）](#chaining链式调用)。

示例：[`08_arrays/09_filter.js`](08_arrays/09_filter.js)

### reduce, reduceRight（归约）

`arr.reduce(reducer, initialValue?)` 把整个数组「折叠」成**一个值**，回调签名是 `(accumulator, element, index, array)`，每次返回的新累加值传入下一轮；`reduceRight` 只是把遍历方向反过来（从右到左）。它最灵活也最容易写错，三条要点必须记住：第一，**不给初始值时**，第一次迭代用 `arr[0]` 作累加器、从 `arr[1]` 开始——空数组不给初始值会抛 `TypeError`，所以**永远显式传初始值**；第二，它**跳过稀疏数组的空洞**；第三，累加器可以是任意类型（对象、数组、`Map`），所以求和、计数、分组、去重、构建索引都能用它表达。可读性上，若 `map`/`filter` 能表达清楚就别硬写 `reduce`。

也见 [Chaining（链式调用）](#chaining链式调用)、[Object.groupBy, Map.groupBy（分组）](#objectgroupby-mapgroupby分组)。

示例：[`08_arrays/10_reduce.js`](08_arrays/10_reduce.js)

### Chaining（链式调用）

链式调用指把多个**返回数组**的方法依次点下去：`arr.filter(...).map(...).reduce(...)`。它成立的前提是每个方法都返回数组（或至少返回可继续调用方法的对象），这也是 `sort`、`splice` 之类返回非数组的方法不能出现在链中间的原因。关键实践：把「筛选 → 变换 → 聚合」按此顺序排列，能避免对全量数据做昂贵变换；链式代码每行一个操作、可读性最好。两个注意点：一是链越长、中间数组越多，大数据量下内存与时间开销叠加，必要时用一次 `reduce` 合并；二是 `map`/`filter` 产生的都是**浅拷贝**，链上修改对象元素仍会影响外部引用。

也见 [map（映射）](#map映射)、[reduce, reduceRight（归约）](#reduce-reduceright归约)。

示例：[`08_arrays/21_chaining_practice.js`](08_arrays/21_chaining_practice.js)

### flat, flatMap（扁平化）

`arr.flat(depth = 1)` 按指定深度**摊平嵌套数组**，返回新数组；`depth` 可传 `Infinity` 完全摊平（此时它会**移除所有空洞**）。`arr.flatMap(fn)` 等价于「先 `map` 再 `flat(1)`」，但只遍历一次、性能更好，并且能实现「一变零或一变多」：回调返回数组就展开一层，返回非数组就当普通元素，返回 `[]` 就等于删掉这一项。关键细节：`flatMap` 的展开深度**固定为 1**，无法配置，超过一层要再链一次 `flat`；两者都不修改原数组；`flat` 在 `depth` 为 0 时返回浅拷贝，只有 `Infinity` 才保证消掉空洞。

也见 [map（映射）](#map映射)、[concat（连接）](#concat连接)。

示例：[`08_arrays/11_flat_and_flatMap.js`](08_arrays/11_flat_and_flatMap.js)

### sort（排序）

`arr.sort(compareFn?)` 对数组**就地排序并返回同一个数组引用**（可变操作，不是新数组）。最著名的坑是**默认行为**：不传比较函数时，元素会先被转成字符串再按 UTF-16 码元顺序比较，于是 `[10, 9, 1].sort()` 得到 `[1, 10, 9]`。因此**数字排序必须显式传比较函数** `(a, b) => a - b`。另外 `undefined` 和空洞总是被排到**最后**，且不会调用比较函数；`sort` 对稀疏数组只排序存在的元素。因为它是就地的，`[...arr].sort(...)` 或 `arr.toSorted(...)` 才是「拿一个排好序的副本」的正确写法。

也见 [Comparator（比较函数）](#comparator比较函数)、[Sort Stability（排序稳定性）](#sort-stability排序稳定性)、[Array Copying Methods（数组拷贝方法）](#array-copying-methods数组拷贝方法)。

示例：[`08_arrays/12_sort.js`](08_arrays/12_sort.js)

### Comparator（比较函数）

比较函数 `(a, b) => number` 是 `sort` 的「裁判」，规则是：返回**负数**表示 `a` 排在 `b` 前，返回**正数**表示 `a` 排在 `b` 后，返回 **0** 表示两者视为相等（保持相对顺序，依赖稳定性）。常用写法：数字升序 `(a, b) => a - b`、降序 `(a, b) => b - a`、字符串按人类语言 `(a, b) => a.localeCompare(b, 'zh-Hans-CN')`。多字段排序利用「第一个比较结果非 0 就短路」的技巧：`(a, b) => a.dept.localeCompare(b.dept) || b.score - a.score`。**最大的坑是「不一致的比较函数」**：如果裁判自相矛盾（比如 `return a > b`，返回布尔值而非数字），排序结果可能完全错乱甚至不终止——`true` 会被当成 `1`、`false` 当成 `0`，永远不返回负数。

也见 [sort（排序）](#sort排序)、[localeCompare（本地化比较）](#localecompare本地化比较)。

示例：[`08_arrays/12_sort.js`](08_arrays/12_sort.js)

### Sort Stability（排序稳定性）

排序稳定性指「**键值相等的元素，排序后是否保持原有相对顺序**」。ES2019 起规范**保证 `Array.prototype.sort` 是稳定的**，这带来一个非常实用的技巧：**先按次要字段排一次，再按主要字段排一次**，最终结果是「主要字段有序、主要字段相同时按次要字段有序」——因为第二次排序不会打乱第一次建立好的次序。稳定性也让「多级排序」可以不写复杂的比较函数。关键细节：稳定性的前提是你的比较函数**真的返回 0** 表示相等（返回布尔值的比较函数既不稳定也不正确）；历史上的实现（如老 V8）对短数组用插入排序（稳定）、对长数组用快排（不稳定），所以老代码里确实存在「换台机器结果就变」的现象。

也见 [Comparator（比较函数）](#comparator比较函数)、[sort（排序）](#sort排序)。

示例：[`08_arrays/12_sort.js`](08_arrays/12_sort.js)

### some, every（存在与全称判断）

`arr.some(fn)` 判断「是否**至少有一个**元素满足条件」，`arr.every(fn)` 判断「是否**所有**元素都满足条件」，都返回布尔值。两者都**短路**：`some` 遇到第一个真值立刻返回 `true`，`every` 遇到第一个假值立刻返回 `false`，因此**空数组**上 `some` 返回 `false`、`every` 返回 `true`（空真值，容易反直觉）。回调签名是 `(element, index, array)`，且都**跳过稀疏数组的空洞**——对稀疏数组，空洞既不会让 `some` 变真，也不会让 `every` 变假。它们常被用来替代「带 `break` 的 `for` 循环」，让意图更明确。

也见 [find, findIndex, findLast, findLastIndex（查找）](#find-findindex-findlast-findlastindex查找)、[includes（包含判断）](#includes包含判断)。

示例：[`08_arrays/14_some_and_every.js`](08_arrays/14_some_and_every.js)

### Array.prototype.at()（按索引取值）

`arr.at(i)` 按下标取一个元素，与 `arr[i]` 的唯一区别是**支持负数**：`arr.at(-1)` 取最后一个元素，`arr.at(-2)` 取倒数第二个。它解决的是「`arr[arr.length - 1]`」这种冗长写法的可读性问题，越界时返回 `undefined`（不抛错）。关键细节：`at` 是数组和字符串**都有**的方法（`String.prototype.at` 行为一致），所以在数组和字符串之间可以无脑通用；但它是**方法**而不是属性访问，在可选链里要写成 `arr?.at(-1)`；负数超出范围（如长度为 3 时 `at(-4)`）返回 `undefined`。

也见 [slice（切片）](#slice切片)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`08_arrays/15_at_and_negative_index.js`](08_arrays/15_at_and_negative_index.js)

### Array Copying Methods（数组拷贝方法）

ES2023 为四个「可变方法」补上了**不可变版本**，统一返回新数组、绝不修改原数组：`toSorted(cmp)` 对应 `sort`，`toReversed()` 对应 `reverse`，`toSpliced(start, del, ...items)` 对应 `splice`，`with(index, value)` 对应「按下标替换单个元素」（下标可为负，越界抛 `RangeError`）。另外 `toReversed`/`toSorted` 会**保留稀疏数组的空洞**，而 `toSpliced`/`with` 会把空洞转成真 `undefined`。它们的实用价值在于「函数式风格 + 不可变状态」：在不希望改动原数组（React 状态、共享配置、参数校验）时，一行就能拿到副本，比 `[...arr].sort()` 更清晰。在旧环境（Node < 20、老浏览器）中使用需要转译或降级为展开运算符写法。

也见 [sort（排序）](#sort排序)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`08_arrays/13_reverse_and_fill.js`](08_arrays/13_reverse_and_fill.js)、[`08_arrays/18_copy_array.js`](08_arrays/18_copy_array.js)

### Object.groupBy, Map.groupBy（分组）

ES2024 标准化的两个**静态**分组方法（提案里曾是 `arr.groupBy`，最终为避免与第三方库冲突改成静态方法，理由与 `Object.hasOwn` 相同）。`Object.groupBy(items, fn)` 返回一个**无原型（null 原型）对象**，键是回调返回值经「属性键转换」后的字符串或 Symbol；`Map.groupBy(items, fn)` 返回 `Map`，键保持原类型。这个差异是关键：用 `Object.groupBy` 按数字分组，键 `20` 会变成字符串 `'20'`，按键为对象分组则全部塌缩成 `'[object Object]'`——**要保留原始键类型必须用 `Map.groupBy`**。因为结果是无原型对象，`result.hasOwnProperty('x')` 会抛 `TypeError`，要用 `Object.hasOwn(result, 'x')`。分组回调签名是 `(element, index, array)`。

也见 [reduce, reduceRight（归约）](#reduce-reduceright归约)、[in, hasOwnProperty, Object.hasOwn（属性存在性判断）](#in-hasownproperty-objecthasown属性存在性判断)、[Object.create（创建）](#objectcreate创建)。

示例：[`08_arrays/20_grouping.js`](08_arrays/20_grouping.js)

### Shallow Copy vs Deep Copy（浅拷贝与深拷贝）

浅拷贝只复制**第一层的结构**，嵌套的对象/数组仍然是**共享引用**；深拷贝则递归复制所有层级，得到完全独立的副本。JS 里的 `[...arr]`、`arr.slice()`、`Object.assign({}, o)`、`{...o}`、`arr.toSorted()` 全是**浅拷贝**——改 `copy[0].x` 会同时改到原数组，这是最经典的「改了副本结果原数据也变了」事故。深拷贝的现代首选是 `structuredClone(value)`（内置，支持 `Map`/`Set`/`Date`/`ArrayBuffer`/循环引用，但**不能克隆函数、DOM 节点、原型链**）；老牌写法 `JSON.parse(JSON.stringify(o))` 虽然流行，却会丢掉 `undefined`、函数、Symbol 键，把 `Date` 变成字符串、把 `NaN` 变成 `null`，并遇到循环引用直接抛错。手写递归时还要单独处理循环引用，否则栈溢出。

也见 [Object.assign（合并）](#objectassign合并)、[Object Spread（对象展开）](#object-spread对象展开)、[Shallow Freeze vs Deep Freeze（浅冻结与深冻结）](#shallow-freeze-vs-deep-freeze浅冻结与深冻结)。

示例：[`08_arrays/18_copy_array.js`](08_arrays/18_copy_array.js)、[`09_objects/12_deep_clone.js`](09_objects/12_deep_clone.js)

### Callback Signature Pitfall（回调签名陷阱）

数组迭代方法调用回调时**不是只传一个参数**，而是固定传三个：`(元素, 下标, 数组本身)`。如果把一个「原本不是为当回调而设计」的函数直接传进去，它的形参会被按位置硬塞，参数含义冲突时就产生**不报错但结果错误**的静默 bug。最经典的是 `['1','2','3'].map(parseInt)` 得到 `[1, NaN, NaN]`：`map` 传的第 2 个参数是**下标**，而 `parseInt` 需要的第 2 个参数是**进制（radix）**，于是下标 0、1、2 被当成进制——0 视为十进制、进制 1 非法、二进制里没有 3。修复办法是包一层：`arr.map(s => parseInt(s, 10))` 或 `arr.map(Number)`。同理，`['a','b'].map(console.log)`、`arr.filter(Boolean)` 之外的 `arr.filter(某多参函数)`、`arr.reduce(某个双参函数)` 都可能中招——**凡是把现成函数直接当回调传，都要先确认参数个数和含义对得上**。

也见 [map（映射）](#map映射)、[parseInt, parseFloat（解析数字）](#parseint-parsefloat解析数字)、[forEach（遍历）](#foreach遍历)。

示例：[`08_arrays/22_callback_signature_pitfall.js`](08_arrays/22_callback_signature_pitfall.js)

## 对象（Object）

### Object Literal（对象字面量）

对象字面量 `{ key: value, ... }` 是创建对象最常用的方式，它描述的是「**键值对的无序集合**」（实际上是「有序的字符串/Symbol 键属性集合」，顺序规则见属性顺序）。字面量里可以写字符串/数字/计算属性名、可以用简写、可以定义方法、可以用 `get`/`set` 定义访问器，也支持展开运算符合并。关键细节：字面量的原型固定是 `Object.prototype`（想指定原型要用 `Object.create` 或 `__proto__` 字面量键）；用字面量创建的对象属性描述符默认全是「全开」（可写、可枚举、可配置）。常见的语法坑是**在语句位置写 `{ a: 1 }`** 会被解析成「带标签的块语句」而不是对象，必须用括号包起来：`({ a: 1 });`。

也见 [Property, Key, Value（属性、键与值）](#property-key-value属性键与值)、[Object.create（创建）](#objectcreate创建)。

示例：[`09_objects/01_object_literal.js`](09_objects/01_object_literal.js)

### Property, Key, Value（属性、键与值）

对象由**属性（property）**组成，每个属性是一个「键 → 值」的绑定。**键（key）**只能是**字符串或 Symbol**：写数字键 `{1: 'a'}` 会被自动转成 `'1'`；用对象当键会被转成 `'[object Object]'`（几乎总是 bug）。**值（value）**可以是任意类型，包括函数（此时这个属性常被称为方法）。属性还有三个隐藏开关：`writable`、`enumerable`、`configurable`（见属性描述符）。关键区分：属性既可能来自**自有属性**，也可能来自**原型链上的继承属性**，`obj.key` 会顺着原型链查找，而 `Object.keys` 只看自有的可枚举属性。需要非字符串键时应该用 `Map`（见 `23_collections/`）。

也见 [Own Property vs Inherited Property（自有属性与继承属性）](#own-property-vs-inherited-property自有属性与继承属性)、[Property Descriptor（属性描述符）](#property-descriptor属性描述符)。

示例：[`09_objects/01_object_literal.js`](09_objects/01_object_literal.js)

### Dot Access vs Bracket Access（点访问与方括号访问）

`obj.key`（点）和 `obj[key]`（方括号）都能读属性，差别在于**方括号里是表达式**，可以是变量、字符串拼接或任意计算结果，而点后面必须是**合法的标识符字面量**。因此「键名存在变量里」时必须用方括号：`obj[field]`；键名含空格、连字符或以数字开头时也必须用方括号：`obj['user-name']`、`obj['1']`。关键细节：`obj[1]` 与 `obj['1']` 是同一个属性（数字键会被转成字符串）；读取**不存在的属性**一律返回 `undefined`（不抛错），继续在 `undefined` 上取属性才会抛 `TypeError`，这就是可选链 `?.` 存在的意义；另外**赋值也适用同一套规则**，`obj[key] = v` 是动态写属性的标准手段。

也见 [Computed Property Name（计算属性名）](#computed-property-name计算属性名)、[in, hasOwnProperty, Object.hasOwn（属性存在性判断）](#in-hasownproperty-objecthasown属性存在性判断)。

示例：[`09_objects/02_property_access.js`](09_objects/02_property_access.js)

### Computed Property Name（计算属性名）

计算属性名指在对象字面量里用**方括号包一个表达式**作为键：`{ [key]: value }`，键在创建时求值，因此可以用变量、模板字符串、函数调用结果。它让「动态构造对象」从「先建空对象再逐条赋值」变成一行字面量，也让「属性简写 + 计算名」的组合非常自然：`{ [id]: { name, age } }` 就能一次构建索引表。关键细节：键表达式如果求值为对象，会被转成 `'[object Object]'`；求值为 `Symbol` 时会成为 Symbol 键（这是给对象挂「半私有」元数据的常用方式）；同一个字面量里计算名和普通键可以混用，重复的键**后者覆盖前者**。

也见 [Dot Access vs Bracket Access（点访问与方括号访问）](#dot-access-vs-bracket-access点访问与方括号访问)、[Shorthand Property and Method（属性简写与方法简写）](#shorthand-property-and-method属性简写与方法简写)。

示例：[`09_objects/03_computed_property_names.js`](09_objects/03_computed_property_names.js)

### Shorthand Property and Method（属性简写与方法简写）

两种把字面量写短的语法糖：**属性简写** `{ name }` 等价于 `{ name: name }`（键名取自变量名）；**方法简写** `{ greet() {} }` 等价于 `{ greet: function greet() {} }`。方法简写不只是短，它带来两个实质区别：简写方法**不能被当作构造函数**（没有 `[[Construct]]`，用 `new` 会抛错），并且它能使用 `super`（见 `09_objects/16_super_in_object_literals.js`），而 `greet: function() {}` 形式的**不是方法而是普通函数属性**，不能用 `super`。另外计算属性名可以和简写组合：`{ [name]: value }`，但**不能**写成 `{ [name] }`——简写只在键和变量同名时成立。

也见 [Computed Property Name（计算属性名）](#computed-property-name计算属性名)、[Object Literal（对象字面量）](#object-literal对象字面量)。

示例：[`09_objects/01_object_literal.js`](09_objects/01_object_literal.js)

### Own Property vs Inherited Property（自有属性与继承属性）

访问 `obj.x` 时，引擎先查对象**自身**的属性，找不到就沿 `[[Prototype]]` 链继续向上找，直到 `null`。**自有属性**是直接挂在该对象上的；**继承属性**来自原型链（例如所有普通对象都能用 `toString`，但它的 `hasOwnProperty('toString')` 为 `false`）。这个区别直接影响三件事：`Object.keys`/`values`/`entries`/`JSON.stringify` 只看**自有可枚举**属性；`for...in` 会**连继承的可枚举属性一起遍历**（所以必须配 `Object.hasOwn` 过滤）；判断「属性是否存在」时 `'x' in obj` 会把继承属性也算进去，想只查自有属性要用 `Object.hasOwn`。`__proto__`（访问器形式）和 `Object.getPrototypeOf` 是查看原型的入口。

也见 [in, hasOwnProperty, Object.hasOwn（属性存在性判断）](#in-hasownproperty-objecthasown属性存在性判断)、[Enumerable（可枚举性）](#enumerable可枚举性)、[Object.create（创建）](#objectcreate创建)。

示例：[`09_objects/02_property_access.js`](09_objects/02_property_access.js)、[`09_objects/11_object_has_own.js`](09_objects/11_object_has_own.js)

### in, hasOwnProperty, Object.hasOwn（属性存在性判断）

三种判断「属性是否存在」的手段，语义逐级不同：`'x' in obj` **包含原型链**（也能判断数组下标，如 `0 in arr` 是判断有无空洞的利器）；`obj.hasOwnProperty('x')` 只看自有属性，但它是**从原型链上继承来的方法**，所以对 `Object.create(null)` 创建的无原型对象会直接抛 `TypeError`，而且对象可以覆写它；`Object.hasOwn(obj, 'x')`（ES2022）是**静态方法**，只查自有属性且不受原型影响，是现在的推荐写法——它之所以做成静态方法而非 `obj.hasOwn`，正是为了避免与已有第三方库或用户属性冲突。注意：三者判断的都是「**属性是否存在**」，不是「值是否为 `undefined`」，`{a: undefined}` 对三者都返回「存在」。

也见 [Own Property vs Inherited Property（自有属性与继承属性）](#own-property-vs-inherited-property自有属性与继承属性)、[Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)。

示例：[`09_objects/11_object_has_own.js`](09_objects/11_object_has_own.js)

### Enumerable（可枚举性）

`enumerable` 是属性的三个开关之一，决定这个属性**是否会被「遍历类」操作看见**：`for...in`、`Object.keys`/`values`/`entries`、展开运算符 `{...o}`、`Object.assign`、`JSON.stringify` 都只处理可枚举属性；而 `Object.getOwnPropertyNames`、`Object.getOwnPropertyDescriptor`、直接属性访问 `obj.x` **不受它影响**。用字面量或赋值创建的属性默认 `enumerable: true`；用 `Object.defineProperty` 定义时**默认是 `false`**（这个默认值差异是高频坑）。标准库里很多「隐形」成员就是靠它实现：数组的 `length`、类的原型方法、`Symbol.iterator` 都是不可枚举的，所以不会出现在 `Object.keys` 或 `JSON.stringify` 里。

也见 [Property Descriptor（属性描述符）](#property-descriptor属性描述符)、[Object.keys, values, entries（键值遍历）](#objectkeys-values-entries键值遍历)。

示例：[`09_objects/08_property_descriptors.js`](09_objects/08_property_descriptors.js)

### Property Descriptor（属性描述符）

每个属性背后都有一份描述符对象，说明它「是什么、能不能改」：**数据属性**用 `{ value, writable, enumerable, configurable }`，**访问器属性**用 `{ get, set, enumerable, configurable }`。四个开关的含义是：`writable` 能否重新赋值；`enumerable` 是否出现在遍历与序列化中；`configurable` 能否 `delete`、能否**修改描述符**（一旦设为 `false` 就**不可逆**，且此时 `writable` 只能从 `true` 改成 `false`，不能反向）。用 `Object.defineProperty(obj, key, desc)` 单独定义，用 `Object.defineProperties` 批量定义，用 `Object.getOwnPropertyDescriptor(s)` 读取。关键默认值陷阱：`defineProperty` 未指定的开关**一律默认 `false`**，而在赋值/字面量里全默认 `true`——这解释了「为什么我用 `defineProperty` 加的属性 `Object.keys` 看不见」。

也见 [Enumerable（可枚举性）](#enumerable可枚举性)、[Accessor Property（访问器属性）](#accessor-property访问器属性)、[Object.freeze, seal, preventExtensions（对象锁定）](#objectfreeze-seal-preventextensions对象锁定)。

示例：[`09_objects/08_property_descriptors.js`](09_objects/08_property_descriptors.js)

### Accessor Property（访问器属性）

访问器属性（getter/setter）把「读属性」和「写属性」变成**函数调用**：`get` 在读取 `obj.x` 时执行、返回值即属性值；`set` 在 `obj.x = v` 时执行。它用来在保持「属性式语法」的同时插入逻辑——校验、懒计算、缓存、派生值、内部字段代理。定义方式有两种：字面量里写 `get x() {}` / `set x(v) {}`，或用 `Object.defineProperty` 传 `{ get, set }`。关键细节：访问器属性**没有 `value` 和 `writable`**（描述符是二选一的形态），写它会调用 `set`（没有 `set` 时严格模式下抛 `TypeError`）；`get`/`set` 也是普通函数，`this` 指向调用对象，因此可以被继承和覆写；**不要在 getter 里访问自己同名属性**，那会无限递归爆栈（常见于误写成 `get x() { return this.x }`）。

也见 [Property Descriptor（属性描述符）](#property-descriptor属性描述符)、[Object.freeze, seal, preventExtensions（对象锁定）](#objectfreeze-seal-preventextensions对象锁定)。

示例：[`09_objects/07_getter_setter.js`](09_objects/07_getter_setter.js)

### Object.keys, values, entries（键值遍历）

三个静态方法把对象的**自有可枚举属性**转成数组，因此可以直接接 `map`/`filter`/`reduce`：`Object.keys(o)` 返回键数组，`Object.values(o)` 返回值数组，`Object.entries(o)` 返回 `[key, value]` 对的数组。关键细节：它们**不包含继承属性、不包含不可枚举属性、也不包含 Symbol 键**（要 Symbol 键用 `Object.getOwnPropertySymbols`，要包括不可枚举属性用 `Object.getOwnPropertyNames`）；顺序遵循属性顺序规则（整数键升序在前，然后字符串键按插入序，最后 Symbol 键）。`Object.entries` 常与 `for (const [k, v] of ...)` 搭配使用，是遍历对象的现代标准写法；`Object.values` 让「对对象的值做聚合」变得和数组一样自然。

也见 [Object.fromEntries（从条目构造对象）](#objectfromentries从条目构造对象)、[Property Order（属性顺序）](#property-order属性顺序)。

示例：[`09_objects/05_keys_values_entries.js`](09_objects/05_keys_values_entries.js)

### Object.fromEntries（从条目构造对象）

`Object.fromEntries(iterable)` 是 `Object.entries` 的**逆操作**：接收任何可迭代的「`[key, value]` 对」序列（二维数组、`Map`、生成器），返回一个新对象。它把「先转成条目数组再变换」的管道补完：`Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]))` 就是一句「对象版 `map`」。关键细节：键会经过标准的属性键转换（数字变字符串）；重复键**后者覆盖前者**；它能直接吃 `Map`，因为 `Map` 迭代出来的正是 `[key, value]` 对——所以 `Object.fromEntries(map)` 是 `Map → 普通对象` 的一行转换（但键必须是字符串/符号，对象键会塌缩成 `'[object Object]'`）。用它做「过滤对象」「重命名键」比 `reduce` 直观得多。

也见 [Object.keys, values, entries（键值遍历）](#objectkeys-values-entries键值遍历)、[Object.groupBy, Map.groupBy（分组）](#objectgroupby-mapgroupby分组)。

示例：[`09_objects/05_keys_values_entries.js`](09_objects/05_keys_values_entries.js)

### Object.assign（合并）

`Object.assign(target, ...sources)` 把多个源对象的**自有可枚举属性**（含 Symbol 键）复制到 `target`，**返回 `target` 本身**（不是新对象），因此常用于「合并配置」和「补默认值」。关键细节：它是**浅拷贝**，嵌套对象共享引用；同名键**后面的覆盖前面的**（`Object.assign({}, defaults, options)` 是标准补默认值写法）；它**会触发源对象的 getter 和目标对象的 setter**（因为它走的是普通赋值语义，而不是 `defineProperty`）；传 `null`/`undefined` 源会被忽略，但 `target` 为 `null`/`undefined` 会抛 `TypeError`；**不会复制不可枚举属性和原型链上的属性**。现代代码里 `{ ...defaults, ...options }` 更常用，但 `assign` 的优势是能修改已有对象（`Object.assign(state, patch)`），这在不能重新赋值的场合很实用。

也见 [Object Spread（对象展开）](#object-spread对象展开)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/06_object_assign.js`](09_objects/06_object_assign.js)

### Object.create（创建）

`Object.create(proto, descriptors?)` 创建一个**以指定对象为原型**的新对象：`Object.create(null)` 得到**没有原型**的「纯净字典」（没有 `toString`、`hasOwnProperty`，因此完全不怕原型污染和键名冲突，非常适合当查找表）；`Object.create(someProto)` 是 ES6 `class` 之前实现继承的标准手段（见 `16_prototype/`）。可选的第二参数用属性描述符定义属性（注意此时开关默认全是 `false`）。关键细节：`Object.create` 是**唯一能在创建时就指定原型**的方式（`{__proto__: p}` 是它的语法糖，但 `__proto__` 是遗留访问器，不推荐）；原型链查找意味着新对象的继承属性不会出现在 `Object.keys` 里，这会和「期望拿到普通对象」的代码产生意外。

也见 [Own Property vs Inherited Property（自有属性与继承属性）](#own-property-vs-inherited-property自有属性与继承属性)、[Object.groupBy, Map.groupBy（分组）](#objectgroupby-mapgroupby分组)。

示例：[`09_objects/10_object_create.js`](09_objects/10_object_create.js)

### Object.freeze, seal, preventExtensions（对象锁定）

三个逐级收紧的「锁定」方法，本质都是批量修改属性描述符：`Object.preventExtensions(o)` 只禁止**新增**属性；`Object.seal(o)` 在上一级基础上禁止**删除**、并把所有属性变成 `configurable: false`（但值仍可写）；`Object.freeze(o)` 再进一步，把所有数据属性变成 `writable: false`，即完全只读。严厉程度是 `preventExtensions < seal < freeze`。三个要点必须记住：第一，它们**都返回传入的那个对象本身**（不是新副本），所以 `const frozen = Object.freeze(obj)` 里的 `frozen === obj`；第二，它们**都是浅操作**，嵌套对象依然可以改；第三，在**非严格模式**下违反约束是**静默失败**（不报错、也不生效），严格模式（模块代码默认严格）下才抛 `TypeError`。配套的判断方法是 `Object.isExtensible`/`isSealed`/`isFrozen`。

也见 [Shallow Freeze vs Deep Freeze（浅冻结与深冻结）](#shallow-freeze-vs-deep-freeze浅冻结与深冻结)、[Property Descriptor（属性描述符）](#property-descriptor属性描述符)。

示例：[`09_objects/09_freeze_seal.js`](09_objects/09_freeze_seal.js)

### Shallow Freeze vs Deep Freeze（浅冻结与深冻结）

`Object.freeze` 只冻结**第一层**：被冻结对象的嵌套对象、数组元素仍然可以被修改，所以「冻结了配置对象却还能改 `config.db.host`」是极其常见的漏洞。**深冻结**需要自己递归实现：遍历所有属性，对每个对象值递归调用 `Object.freeze`（务必用 `Object.hasOwn`/`Object.keys` 过滤，并用 `WeakSet` 记录已处理对象，否则遇到**循环引用**会无限递归）。关键细节：递归时要注意跳过不可枚举与访问器属性，且对**函数、`Map`/`Set`、`Date`** 的冻结语义要单独考虑（冻结 `Map` 并不能阻止 `map.set`）。若只是要防意外修改，`structuredClone` 出一个独立副本往往比深冻结更实用——它不阻止修改，但改的是副本。

也见 [Object.freeze, seal, preventExtensions（对象锁定）](#objectfreeze-seal-preventextensions对象锁定)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/09_freeze_seal.js`](09_objects/09_freeze_seal.js)、[`09_objects/12_deep_clone.js`](09_objects/12_deep_clone.js)

### Object Spread（对象展开）

`{ ...source }` 把源对象的**自有可枚举属性**（含 Symbol 键）复制到一个新对象里，是对象浅拷贝与合并的现代写法。与 `Object.assign` 的对比是重点：`{...a, ...b}` 总能得到**新对象**（不会像 `assign` 那样污染第一个参数），合并顺序同样是「后者覆盖前者」，也不复制不可枚举与继承属性。差异细节：对象展开**不触发 setter**，而是在新对象上以普通数据属性落地（这是与 `Object.assign` 的实质区别）；`{...null}` 和 `{...undefined}` 是安全的（得到空对象），而 `Object.assign({}, null)` 也安全但 `Object.assign(null, {})` 抛错；展开在赋值位置会创建新对象，所以**不能**用 `{...state} = patch` 这种写法，展开只读不写。

也见 [Object.assign（合并）](#objectassign合并)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/04_spread_merge.js`](09_objects/04_spread_merge.js)

### Property Order（属性顺序）

对象的属性有确定且**规范保证**的顺序：**整数索引键**（能被转成 `0 ≤ n < 2³²-1` 的非负整数的字符串键）按**数值升序**排在最前；然后是**字符串键**按**插入顺序**排列；最后是 **Symbol 键**按插入顺序排列。这套规则直接影响 `Object.keys`/`values`/`entries`、`for...in`、`JSON.stringify` 和 `Object.assign` 的输出。最实用的含义是：如果拿对象当「按 id 索引的集合」，遍历时**永远按 id 升序**而不是插入顺序——想保留插入顺序必须用 `Map`（`Map` 严格按插入顺序迭代，这是它相对对象的核心优势之一）。另外数组作为「整数键对象」自然按数字升序迭代，这也解释了为什么用数组存稀疏下标不会打乱顺序。

也见 [Object.keys, values, entries（键值遍历）](#objectkeys-values-entries键值遍历)、[Property, Key, Value（属性、键与值）](#property-key-value属性键与值)。

示例：[`09_objects/14_property_order.js`](09_objects/14_property_order.js)

### Object Identity vs Structural Equality（对象身份与结构相等）

JS 的 `===` 对对象比较的是**身份（引用）**，不是内容：`{} === {}` 为 `false`，`[1,2] === [1,2]` 为 `false`，只有两个变量指向**同一个对象**才为 `true`。这对数组方法影响巨大：`indexOf`/`includes`/`Set`/`Map` 的键比较全部按引用，所以「查一个内容相同的对象是否存在」永远失败。**结构相等**（内容相等）需要自己实现或借助工具：手写递归比较（要处理 `NaN`、`Date`、`Map`/`Set`、循环引用），用 `JSON.stringify` 比较（简单但受**属性顺序**影响，且丢 `undefined`/函数），或使用 `lodash.isEqual`/`node:assert` 的 `deepStrictEqual`。`Object.is(a, b)` 则是一个小补丁：它和 `===` 几乎相同，但认为 `Object.is(NaN, NaN)` 为 `true`、`Object.is(0, -0)` 为 `false`（即 SameValue）。

也见 [Property Order（属性顺序）](#property-order属性顺序)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/13_object_methods.js`](09_objects/13_object_methods.js)

## 解构（Destructuring）

### Destructuring Assignment（解构赋值）

从数组或对象中按「形状」提取值并赋给变量的语法，本质是**模式匹配**的简化形式。对象解构按**属性名**匹配（不关心顺序），数组解构按**位置**匹配（依赖迭代器协议）；两者都支持默认值、重命名、剩余元素。它让「从多层嵌套结构里取几个字段」从多行赋值变成一行声明，也让函数参数可以直接声明「我关心哪几个字段」。三条关键规则：默认值**只在取到 `undefined` 时生效**（取到 `null`、`0`、`''`、`false` 都不触发，这是最常见的误解）；解构是「按形状取值」，取不到的变量得到 `undefined` 而不是报错；解构赋值**不需要声明关键字**，`[a, b] = [b, a]` 这种「赋值给已有变量」的写法**必须用括号包起来**（`({a} = o)`、`[a, b] = arr`），否则行首的 `{`、`[` 会被解析成块语句或数组字面量。

也见 [Object Pattern（对象模式）](#object-pattern对象模式)、[Array Pattern（数组模式）](#array-pattern数组模式)、[Default Value（默认值）](#default-value默认值)。

示例：[`10_destructuring/01_object_destructuring.js`](10_destructuring/01_object_destructuring.js)

### Object Pattern（对象模式）

对象解构 `const { a, b } = obj` 从右侧对象按**属性名**取值，与书写顺序无关，也不要求属性存在（不存在则为 `undefined`）。它内部走的是**属性访问（`[[Get]]`）**，因此**会触发 getter、也会沿原型链查找**——也就是说可以解构出继承属性，这与「只取自有属性」的直觉不同。重命名用冒号：`const { a: x } = obj`（读 `obj.a` 存进 `x`，注意 `a` 本身不再是变量）；默认值和重命名可以叠加：`const { a: x = 1 } = obj`。对象解构在赋值目标里**必须用括号包裹**：`({ a } = obj)`。它最常用的场合是「从大对象里挑几个字段」和「模块/配置项的具名提取」。

也见 [Renaming（重命名）](#renaming重命名)、[Nested Destructuring（嵌套解构）](#nested-destructuring嵌套解构)、[Default Value（默认值）](#default-value默认值)。

示例：[`10_destructuring/01_object_destructuring.js`](10_destructuring/01_object_destructuring.js)

### Array Pattern（数组模式）

数组解构 `const [a, b] = arr` 按**位置**把值赋给变量，靠的是**迭代器协议**而不是「数组」这个类型。它支持四种常用形态：基本取值；**跳位**用逗号占位（`const [, second] = arr`）；剩余元素用 `...rest`（`const [first, ...others] = arr`，`rest` 永远是数组，且只能是**最后一个**元素）；嵌套解构。关键细节：右侧不是数组也没关系，任何可迭代对象都行（字符串、`Set`、`Map`、生成器、`arguments`）；右侧为 `null`/`undefined`/不可迭代对象会**抛 `TypeError`**（这是解构与 `const x = arr[0]` 最大的行为差异）；多出来的变量得到 `undefined`，多余的元素被丢弃。

也见 [Iterable Destructuring（可迭代对象解构）](#iterable-destructuring可迭代对象解构)、[Rest Element（剩余元素）](#rest-element剩余元素)、[Nested Destructuring（嵌套解构）](#nested-destructuring嵌套解构)。

示例：[`10_destructuring/02_array_destructuring.js`](10_destructuring/02_array_destructuring.js)、[`08_arrays/17_array_destructuring.js`](08_arrays/17_array_destructuring.js)

### Default Value（默认值）

解构的默认值写作 `const { a = 1 } = obj` 或 `const [x = 1] = arr`，它**只在取到的值是 `undefined` 时生效**——这是整个解构语法里最容易被误记的一条。`null` 不触发默认值（`const {a = 1} = {a: null}` 得到 `null`），`0`、`''`、`false`、`NaN` 也都不会触发。更精确地说，默认值只在「属性不存在」或「属性值严格等于 `undefined`」时被求值，而且是**惰性求值**：只有真的需要时才计算右边表达式（所以可以写 `const { a = expensive() } = obj`）。如果语义是「`null` 也算缺失」，必须显式处理：`const a = obj.a ?? 1`。默认值常与重命名、嵌套同时出现，也要注意默认值表达式**不能引用同一模式里声明的其他变量**（它们在同一个作用域里声明，尚未初始化）。

也见 [Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)、[Renaming（重命名）](#renaming重命名)。

示例：[`10_destructuring/04_default_values.js`](10_destructuring/04_default_values.js)

### Renaming（重命名）

在对象解构中用冒号给变量改名：`const { name: userName, age: userAge } = user`。冒号左边是**属性名**（取值依据），右边是**新变量名**（真正声明的标识符）。三个要点：重命名后**原属性名不再是变量**（`userName` 有值，`name` 未定义）；重命名可以和默认值叠加 `{ name: userName = '匿名' }`；重命名也可以嵌套 `{ user: { name } }`（此时 `user` 不是变量）。数组解构没有重命名概念——变量名本来就是你自己起的，`const [first, second] = arr` 本身就是「重命名」。常见用途是：解构出的名字和当前作用域里已有变量冲突时避免重名，或把 `{ id, name }` 里的 `name` 改成更明确的 `userName`。

也见 [Object Pattern（对象模式）](#object-pattern对象模式)、[Nested Destructuring（嵌套解构）](#nested-destructuring嵌套解构)。

示例：[`10_destructuring/01_object_destructuring.js`](10_destructuring/01_object_destructuring.js)

### Rest Element（剩余元素）

解构里的 `...rest` 把「没被前面的模式取走的剩余部分」收集起来，位置**必须在最后**。类型取决于左侧形态：**对象模式**中 `const { a, ...rest } = obj` 得到的是一个**新对象**，包含除 `a` 之外的所有**自有可枚举属性**（含 Symbol 键，浅拷贝）；**数组模式**中 `const [a, ...rest] = arr` 得到的是一个**新数组**。关键细节：`rest` 在数组模式里总是**密集数组**（空洞会被填成 `undefined`）；对象模式的 `rest` 是浅拷贝，嵌套对象仍共享引用；空模式 `const {...all} = obj` 是「浅拷贝且排除若干键」的干净写法（比 `delete` 安全，因为它不修改原对象）。不要与函数参数里的剩余参数（`function f(...args)`）混淆——语法相似，但一个是解构模式，一个是参数列表。

也见 [Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)、[Object Spread（对象展开）](#object-spread对象展开)。

示例：[`10_destructuring/02_array_destructuring.js`](10_destructuring/02_array_destructuring.js)、[`10_destructuring/06_swap_and_tricks.js`](10_destructuring/06_swap_and_tricks.js)

### Nested Destructuring（嵌套解构）

当数据是多层结构时，可以把模式写成和数据结构同样的形状，一次取到深层字段：`const { user: { profile: { name } } } = data`。关键细节：嵌套模式里的中间层名字（`user`、`profile`）**不会成为变量**，它们只是「路径」；如果某一层可能是 `undefined`，解构会**直接抛 `TypeError`**，所以要配合默认值在**每一层**兜底：`const { user: { profile: { name } = {} } = {} } = data`（注意默认值写在**被解构的那个位置**上）。对象与数组模式可以自由混合：`const [{ name }, { name: second }] = list`。可读性提醒：嵌套超过两层时，拆成两行解构通常比一行长模式更容易维护，也更利于定位哪一层缺数据。

也见 [Default Value（默认值）](#default-value默认值)、[Object Pattern（对象模式）](#object-pattern对象模式)。

示例：[`10_destructuring/03_nested_destructuring.js`](10_destructuring/03_nested_destructuring.js)

### Swap Variables（交换变量）

解构让交换两个变量不再需要临时变量：`[a, b] = [b, a]`——右侧先构造一个新数组，再按位置解构回左侧。要点：这是**赋值**而不是声明，所以如果 `a`、`b` 尚未声明，前面要加 `let`（`let [a, b] = [b, a]` 在 `b` 未定义时会出错）；语句开头的 `[` 可能被上一行的解析粘连影响，稳妥写法是**在前面加分号**或直接用分号结尾（这也是本仓库统一显式分号的原因之一）。同一语法可以扩展到任意多个变量：`[a, b, c] = [c, a, b]` 实现轮换。其他常见小技巧还有：用解构从正则匹配结果里取分组、用 `[x = 0] = arr` 做「取不到就给默认」，以及用对象解构在函数内快速取出配置项。

也见 [Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)、[Array Pattern（数组模式）](#array-pattern数组模式)。

示例：[`10_destructuring/06_swap_and_tricks.js`](10_destructuring/06_swap_and_tricks.js)

### Parameter Destructuring（参数解构）

函数参数位置可以直接写解构模式，让「函数需要哪些字段」在签名处一目了然：`function f({ name, age = 18 }, [x, y]) {}`。它有三个实际好处：调用方不必关心参数顺序（对象解构按名匹配）；默认值直接写在模式里，省掉函数体内的兜底代码；配合剩余元素能实现「取出已知项，其余原样透传」。关键细节与陷阱：**整个参数对象缺失时**默认值不会生效（`f()` 会让 `{name}` 解构 `undefined` 而抛错），要写成 `function f({ name } = {})` 或 `function f({ name = 1 } = {})`；解构参数会让函数 `length` 属性变成 0（因为参数不是简单列表），可能影响依赖 `fn.length` 的库；**回调、事件处理器的入参**（如 `(event)`）解构时要确认字段真的存在于该事件上。

也见 [Default Value（默认值）](#default-value默认值)、[Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)。

示例：[`10_destructuring/05_function_parameters.js`](10_destructuring/05_function_parameters.js)

### Iterable Destructuring（可迭代对象解构）

「数组解构」这个名字其实不准确：方括号解构真正依赖的是**可迭代协议（Iteration Protocol）**，即对象实现了 `Symbol.iterator` 方法。因此数组、字符串、`TypedArray`、`Map`、`Set`、生成器函数返回的生成器对象、`arguments`、`NodeList`，以及自定义的可迭代对象**都能被解构**。这也解释了两个现象：解构字符串得到的是**单个字符**（按码点迭代，emoji 不会被拆开）；解构 `Map` 得到的是 `[key, value]` 对，所以 `for (const [k, v] of map)` 能直接工作。反过来，**普通对象默认不可迭代**（没有 `Symbol.iterator`），所以 `const [a] = {0:'x'}` 会抛 `TypeError`——想让对象也能被方括号解构，必须自己实现 `Symbol.iterator`。

也见 [Array Pattern（数组模式）](#array-pattern数组模式)、[Array-like Object（类数组对象）](#array-like-object类数组对象)。

示例：[`10_destructuring/07_destructuring_iterables.js`](10_destructuring/07_destructuring_iterables.js)

## 字符串（String）

### String（字符串）

字符串是**不可变的 UTF-16 码元序列**，属于**原始值**（primitive），不是对象。它可以用单引号、双引号或反引号（模板字符串）创建，三种写法在功能上等价（模板字符串额外支持插值与换行）。关键细节：因为字符串是原始值，`str.length`、`str.toUpperCase()` 之所以能工作，是引擎在访问属性时临时**包装**成 `String` 对象（装箱）；`typeof 'a'` 是 `'string'`，而 `new String('a')` 是**对象**（`typeof` 为 `'object'`，且 `new String('a') === 'a'` 为 `false`）——**永远不要用 `new String()`**。所有字符串方法都返回**新字符串**，原字符串永不改变，这也是「不可变性」在实践中的体现。

也见 [Immutability（不可变性）](#immutability不可变性)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/01_creation_and_immutability.js`](11_strings/01_creation_and_immutability.js)

### Immutability（不可变性）

不可变性指字符串一旦创建就**无法被修改**：`str[0] = 'X'` 静默失败（严格模式下抛 `TypeError`），`str.toUpperCase()` 不会改变 `str`，只是返回新串。这带来两个实践推论：一是「所有字符串方法都返回新字符串」，所以忘了接收返回值就等于啥也没做（`str.trim();` 这种漏赋值的写法极为常见）；二是**拼接大量字符串性能很差**，每次 `+=` 都可能产生新串，循环里累积上万段文本应该先放进数组再用 `join('')`。与字符串相反，数组和对象是**可变**的，`arr.reverse()`、`obj.x = 1` 都会改变原值——这种「一半不可变、一半可变」的不一致正是许多 bug 的来源（见可变方法与不可变方法）。

也见 [String（字符串）](#string字符串)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)。

示例：[`11_strings/01_creation_and_immutability.js`](11_strings/01_creation_and_immutability.js)

### UTF-16（UTF-16 编码）

JS 字符串内部一律用 **UTF-16** 存储：每个字符占一个 16 位**码元（code unit）**，取值范围 0~65535。Unicode 有超过 16 位的码位（U+10000 以上，如绝大多数 emoji 和部分生僻汉字），这些字符在 UTF-16 里必须用**两个码元**（代理对）表示。这决定了 JS 字符串的三条基本特性：`length` 统计的是**码元数**而非「人眼看到的字符数」；`str[i]`、`charAt`、`slice`、`substring` 都按**码元**切分，可能把一个字符切成两半产生乱码；`for...of`、`[...str]`、`Array.from(str)` 则按**码点**迭代，能正确处理代理对。理解 UTF-16 是理解所有「字符串长度」和「字符串截取」问题的前提。

也见 [Code Unit（码元）](#code-unit码元)、[Code Point（码点）](#code-point码点)、[Surrogate Pair（代理对）](#surrogate-pair代理对)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Code Unit（码元）

码元是 UTF-16 编码的**最小存储单位**，16 位，取值 0x0000~0xFFFF。JS 里几乎所有「按位置操作字符串」的 API 都工作在码元层面：`length`、`str[i]`、`charAt`、`charCodeAt`、`slice`、`substring`、`substr`、`indexOf` 返回的下标，全是码元下标。因此 `'😀'.length` 是 **2**，`'😀'.charCodeAt(0)` 得到的是**高位代理**（0xD83D）而不是什么有意义的字符——这两个事实能解释绝大多数「emoji 处理异常」的报告。反过来，`codePointAt`、`String.fromCodePoint`、`for...of` 是按**码点**工作的。记住一句：**凡是以「下标」「长度」为单位又没提 u 标志/码点的字符串 API，单位都是码元。**

也见 [Code Point（码点）](#code-point码点)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Code Point（码点）

码点是 Unicode 给每个字符分配的**唯一编号**，范围 U+0000~U+10FFFF，与具体编码方式（UTF-16/UTF-8）无关，是「字符」的抽象身份。在 JS 里按码点工作的方法有：`codePointAt(i)` 读取某位置的码点（遇到代理对会正确返回完整码点）、`String.fromCodePoint(cp)` 反向构造字符、`for...of` / `[...str]` / `Array.from(str)` 按码点迭代、正则加 `u` 标志后按码点匹配。关键细节：码点索引与码元索引**不是一回事**，`[...str].length` 得到码点数，`str.length` 得到码元数，两者只在纯 BMP 文本下相等。码点也不是终点——一个「人眼看到的字符」可能是多个码点的组合（如带变音符号的字母、带肤色的 emoji），那叫**字素簇**。

也见 [Code Unit（码元）](#code-unit码元)、[Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Surrogate Pair（代理对）

UTF-16 用**两个 16 位码元**表示一个 U+10000 以上的码点，这两个码元叫代理对：**高位代理**范围 0xD800~0xDBFF，**低位代理**范围 0xDC00~0xDFFF，两者按固定公式合成完整码点。关键要点：单个代理码元**不是合法字符**，如果它落单了（称为孤立代理项），这个字符串就是「畸形 UTF-16」，`encodeURIComponent` 会抛 `URIError`，`JSON.stringify` 会输出 `"\ud800"` 这种脏数据。因此凡是「按码元单位截断/反转/取长度」的操作都可能从中间切开一个代理对：`'😀'.slice(0,1)` 得到一个孤立高位代理。正确做法是按码点或字素簇切分（`[...str]`、`Intl.Segmenter`，见 `33_intl/`）。

也见 [Lone Surrogate and Well-formed（孤立代理项与畸形字符串）](#lone-surrogate-and-well-formed孤立代理项与畸形字符串)、[Code Unit（码元）](#code-unit码元)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)、[`11_strings/13_well_formed_unicode.js`](11_strings/13_well_formed_unicode.js)

### Lone Surrogate and Well-formed（孤立代理项与畸形字符串）

孤立代理项指字符串里出现了**没有配对**的代理码元，这样的字符串称为**畸形（ill-formed）**的 UTF-16，不是合法的 Unicode 文本。产生原因很具体：按码元切片/反转把一个代理对从中间切开、从网络读到被截断的 UTF-8 后错误解码、用 `String.fromCharCode` 手工拼串算错长度。后果是下游 API 崩溃或产出脏数据（`encodeURIComponent` 抛 `URIError`、`JSON.stringify` 输出 `\ud800`、`TextEncoder` 把它换成替换字符）。ES2024 新增了两个方法处理它：`str.isWellFormed()` 检查是否合法，`str.toWellFormed()` 把孤立代理项替换成 U+FFFD（�）并返回修好的新串——**发送到网络或写库之前调用一次 `toWellFormed` 是低成本的保险**。

也见 [Surrogate Pair（代理对）](#surrogate-pair代理对)、[UTF-16（UTF-16 编码）](#utf-16utf-16-编码)。

示例：[`11_strings/13_well_formed_unicode.js`](11_strings/13_well_formed_unicode.js)

### Grapheme Cluster（字素簇）

字素簇是「**人眼感知到的一个字符**」，可能由**多个码点**组成：带变音符号的 `é`（`e` + 组合尖音符，两个码点）、带肤色/性别修饰的 emoji（如 `👨‍👩‍👧` 由多个码点加零宽连接符组成）、国旗 emoji（两个区域指示符码点）。它解释了三个层级的关系：码元（存储单位）→ 码点（Unicode 编号）→ 字素簇（用户感知的字符），`length` 数的是码元，`[...str].length` 数的是码点，**只有字素簇才是「用户以为的字数」**。按字素簇切分和计数需要 `Intl.Segmenter`（`granularity: 'grapheme'`，见 `33_intl/05_intl_segmenter.js`），这是目前唯一的标准方案。做昵称长度校验、文本截断、光标位置时，用 `length` 几乎一定是错的。

也见 [Code Point（码点）](#code-point码点)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/13_well_formed_unicode.js`](11_strings/13_well_formed_unicode.js)、[`33_intl/05_intl_segmenter.js`](33_intl/05_intl_segmenter.js)

### String length（字符串长度陷阱）

`str.length` 返回的是**UTF-16 码元个数**，它等于「人眼看到的字符数」只在纯 BMP 文本（基本拉丁、常用汉字等）下成立。三个必知的偏差：`'😀'.length === 2`（代理对）；`'é'.length` 可能是 1 或 2，取决于它是「预组合字符」还是「`e` + 组合尖音符」（后者需要 `normalize('NFC')` 统一）；`'👨‍👩‍👧'.length` 可能高达 8（多码点字素簇）。因此「最多 10 个字」的校验、按长度截断文本、按长度计算光标位置，都应该改用 **码点**（`[...str].length`、`Array.from(str).length`）或**字素簇**（`Intl.Segmenter`）。另一个相关细节：`String.prototype.at(-1)` 也是按码元的，取 emoji 的最后一个字符会得到半个代理对。

也见 [Code Unit（码元）](#code-unit码元)、[Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)、[Array.prototype.at()（按索引取值）](#arrayprototypeat按索引取值)。

示例：[`11_strings/03_indexing_and_length.js`](11_strings/03_indexing_and_length.js)、[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Template Literal（模板字符串）

模板字符串用**反引号**包裹，支持三种普通字符串做不到的能力：**多行文本**（换行原样保留）、**插值 `${表达式}`**（表达式结果会被转成字符串）、以及作为**标签模板**的基础。关键细节：插值里可以放任意表达式（函数调用、三元、甚至嵌套模板），但**不能放语句**；插值结果的转换规则与字符串拼接一致（对象调 `toString`，`null`/`undefined` 变成 `'null'`/`'undefined'`）；`${}` 内部的反引号需要嵌套一层模板或转义；模板字符串里的转义序列（`\n`、`\t`、`\uXXXX`）与普通字符串相同。它最容易被忽略的价值是「多行字符串 + 缩进控制」，但要注意**缩进会被原样保留**，需要自己 `trim`/`replace` 处理。

也见 [Tagged Template（标签模板）](#tagged-template标签模板)、[String.raw（原始字符串标签）](#stringraw原始字符串标签)。

示例：[`11_strings/02_template_literals.js`](11_strings/02_template_literals.js)

### Tagged Template（标签模板）

标签模板是在模板字符串前写一个函数名形成的特殊调用：`` tagFn`Hello ${name}` ``。它**不是**「先求值成字符串再传给函数」，而是把模板拆成两部分传入：第一个参数是**字符串字面量数组**（`['Hello ', '']`，长度永远比插值个数多 1），后续参数依次是各 `${}` 的**求值结果**。这个数组还有一个只读属性 `strings.raw`，保存**未处理转义符**的原始文本（`\n` 保持为两个字符）。它让「字符串构造过程」可以被拦截改写，典型用途是：自动转义用户输入防 XSS（`` html`<p>${userInput}</p>` ``）、`String.raw` 写 Windows 路径与正则、i18n 提取、CSS-in-JS 与 GraphQL 的查询字面量。关键安全点：**插值值必须显式转义**，标签函数不会自动帮你做。

也见 [Template Literal（模板字符串）](#template-literal模板字符串)、[String.raw（原始字符串标签）](#stringraw原始字符串标签)。

示例：[`11_strings/10_tagged_templates.js`](11_strings/10_tagged_templates.js)

### String.raw（原始字符串标签）

`String.raw` 是语言内置的**标签函数**，返回拼接后的字符串但**保留转义符原样**：`String.raw`\n`` 得到两个字符 `\` 和 `n`，而不是换行符。它最常见的用途是写 **Windows 路径**（`String.raw`C:\Users\name\docs``）和**正则源码**（避免 `\d`、`\w` 被当作字符串转义处理）。关键细节：`String.raw` 的规则是「取 `strings.raw` 数组加上插值结果拼接」，所以插值部分**仍然会正常求值**，只有**字面量部分**的转义被保留；另外并非所有转义都能被「保留」——像 `\u{...}` 这类**非法转义序列**在标签模板里是允许的（普通模板字符串会报错），这也正是标签模板能用来写正则的规范基础。

也见 [Tagged Template（标签模板）](#tagged-template标签模板)、[Template Literal（模板字符串）](#template-literal模板字符串)。

示例：[`11_strings/10_tagged_templates.js`](11_strings/10_tagged_templates.js)

### split（分割）

`str.split(separator, limit?)` 按分隔符把字符串切成**数组**，是 `join` 的逆操作。`separator` 可以是字符串、**正则**或 `undefined`：省略分隔符时返回 `[原字符串]`（只有一个元素的数组），传空串 `''` 则按**码元**逐字拆开（注意 `'😀'.split('')` 得到两个孤立代理项——要按码点拆必须用 `[...str]` 或 `Array.from(str)`）。`limit` 限制返回数组的最大长度（**超出部分被丢弃**，不是截断最后一个）。关键细节：分隔符在开头/结尾或连续出现时会产生**空字符串元素**（`'a,,b'.split(',')` 得到 `['a','','b']`，`'a,'.split(',')` 得到 `['a','']`）——做 CSV 解析时这是高频坑。正则分隔符配合捕获组时，**捕获到的分组也会进入结果数组**。

也见 [join（连接成字符串）](#join连接成字符串)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/06_split_and_join.js`](11_strings/06_split_and_join.js)

### replace, replaceAll（替换）

`str.replace(pattern, replacement)` 替换**第一处**匹配，`str.replaceAll(...)` 替换**所有**匹配，两者都返回新字符串。`pattern` 可以是字符串或正则：**字符串形式只匹配第一处且不做任何模式解释**（`replace('.', '-')` 只换第一个句点，不是「任意字符」）；想全部替换，用 `replaceAll` 或带 `g` 标志的正则。`replacement` 可以是字符串（支持 `$&`、`$1`、`$<name>`、`$`` 等特殊替换模式，注意 `$` 有特殊含义，替换字面美元符号要写 `$$`）或**函数**（`(match, p1, ..., offset, string) => ...`，用来做条件替换、大小写转换、查表）。关键细节：`replaceAll` 传字符串时是**字面量**匹配，传正则时**必须有 `g` 标志**，否则抛 `TypeError`；字符串形式下 `$` 模式依然生效，处理用户输入时要小心。

也见 [Tagged Template（标签模板）](#tagged-template标签模板)、[split（分割）](#split分割)。

示例：[`11_strings/07_replace_methods.js`](11_strings/07_replace_methods.js)

### padStart, padEnd（填充）

`str.padStart(targetLength, padString = ' ')` 在**开头**补字符到指定长度，`padEnd` 在**结尾**补；若原串已达到或超过目标长度则**原样返回**（不截断）。它们是「对齐输出、编号补零、固定宽度报表」的标准工具：`String(n).padStart(4, '0')` 得到 `'0007'`。关键细节：`targetLength` 和 `padString` 的长度单位都是**码元**；填充串会被**重复**以填满差额，如果填不满一个完整周期就**截断填充串**（`'5'.padStart(4, 'ab')` 得到 `'aba5'`）；`padString` 传空串或省略时是空格；负数、`NaN`、`Infinity` 等非法的目标长度会被当作 0（相当于不补）。**常见误解**：以为它能格式化数字的小数位——那是 `toFixed` 的职责，`padStart` 只管总宽度。

也见 [trim（去空白）](#trim去空白)、[toFixed（定点格式化）](#tofixed定点格式化)。

示例：[`11_strings/05_transform_methods.js`](11_strings/05_transform_methods.js)

### trim（去空白）

`str.trim()` 删除字符串**两端**的空白（含空格、制表符、换行、以及 Unicode 定义的各种空白如全角空格、不换行空格），`trimStart()`/`trimEnd()` 只处理单侧。它对**表单输入清洗**是必需步骤：用户在输入框里粘贴时很容易带上首尾空格，导致登录、比对、查表全部失败。关键细节：它只去**两端**、中间的空格保持原样（要去掉所有空格得用 `replace(/\s+/g, '')`）；返回**新字符串**，原串不变（忘了接收返回值就等于没写）；`trim` 在比较前使用要注意「是否应该视为相等」是业务决定——邮箱、用户名通常要 `trim` + `toLowerCase`，而密码**绝不能** `trim`（用户可能真的用了空格）。对应的 `padStart`/`padEnd` 是「加空白」，三者方向相反。

也见 [padStart, padEnd（填充）](#padstart-padend填充)、[localeCompare（本地化比较）](#localecompare本地化比较)。

示例：[`11_strings/05_transform_methods.js`](11_strings/05_transform_methods.js)

### localeCompare（本地化比较）

`a.localeCompare(b, locales?, options?)` 按**人类语言的排序规则**比较两个字符串，返回负数/0/正数（与比较函数约定一致），因此可以直接塞给 `sort`。它解决的是「`<` 和 `>` 按 UTF-16 码元比较」的荒谬结果：码元顺序下所有大写字母都排在小写字母前面、`'ä'` 排在 `'z'` 之后，而中文按码元比较完全不是拼音顺序。常用选项：`sensitivity: 'base'` 忽略大小写与重音（`'a'` 与 `'A'` 视为相等）、`numeric: true` 让 `'file10'` 排在 `'file9'` 之后（自然排序）、`caseFirst` 控制大小写优先。关键细节：性能比 `<` 差很多（每次调用都要走 ICU），对**大数组排序**可先 `Intl.Collator` 建一个比较器复用（见 `33_intl/`）；不传 locales 时结果依赖运行环境的默认区域，**跨环境可能不一致**。

也见 [Comparator（比较函数）](#comparator比较函数)、[String Comparison（字符串比较）](#string-comparison字符串比较)。

示例：[`11_strings/11_string_comparison.js`](11_strings/11_string_comparison.js)

### String Comparison（字符串比较）

字符串比较有两条完全不同的路径：`===` / `<` / `>` 走**码元数值顺序**，`localeCompare` 走**人类语言规则**。前者的问题很具体：`'Z' < 'a'` 为 `true`（'Z' 是 0x5A，'a' 是 0x61）、`'10' < '9'` 为 `true`（逐字符比较，'1' < '9'）、中文按码元很难得到有意义的结果。因此：**判断两个字符串是否相等用 `===`**（它精确、快、不涉及区域设置），**展示给人看的排序用 `localeCompare`**。另外要注意 `==` 会做类型转换（`'1' == 1` 为真），比较字符串一律用 `===`；`includes`/`startsWith`/`endsWith` 做的是子串判断而不是排序比较，且严格区分大小写（不区分大小写要先统一大小写或借助 `localeCompare` 的 `sensitivity`）。数字形式的内容要比较大小，先 `Number()` 再比较。

也见 [localeCompare（本地化比较）](#localecompare本地化比较)、[String（字符串）](#string字符串)。

示例：[`11_strings/11_string_comparison.js`](11_strings/11_string_comparison.js)

### slice, substring, substr（子串截取）

三个截取子串的方法，参数含义与边界处理完全不同：`slice(start, end)` 的第二个参数是**结束下标（不含）**，负数表示**从末尾倒数**；`substring(start, end)` 的第二个参数也是结束下标，但**负数/NaN 一律当 0**，并且 `start > end` 时**自动交换两个参数**（所以 `substring(3, 1)` 等于 `substring(1, 3)`，不返回空串）；`substr(start, length)` 的第二个参数是**长度**，只有 `start` 可为负，**已废弃（Annex B）不应在新代码里使用**。可记的结论是：**统一用 `slice`**，因为它的负参数行为最直观，而且数组上也有同名同义的方法，心智负担最小。三者都返回**新字符串**且按**码元**操作，可能切开代理对；参数省略时 `slice`/`substring` 截到末尾。

也见 [slice（切片）](#slice切片)、[Code Unit（码元）](#code-unit码元)。

示例：[`11_strings/08_substring_methods.js`](11_strings/08_substring_methods.js)

## 数值（Number & Math）

### Number（数值类型）

JS 只有**一种**数字类型 `Number`，内部一律是 **IEEE 754 双精度 64 位浮点数**（1 位符号 + 11 位指数 + 52 位尾数）。它同时承担「整数」和「小数」两种角色，带来两个无法回避的后果：很多十进制小数**无法精确表示**（`0.1 + 0.2 !== 0.3`）；整数超过 2⁵³-1 后**静默丢精度**（雪花 id 被 `JSON.parse` 时后几位变 0）。特殊值有 `NaN`（唯一不等于自身的值，判断必须用 `Number.isNaN`）、`Infinity`/`-Infinity`、`-0`（与 `0` 在 `===` 下相等，`Object.is` 能区分）。`BigInt` 提供任意精度整数（见 `03_data_types/05_bigint.js`），但**不能与 `Number` 混合运算**。需要精确十进制时应该用「整数分」或 decimal 库。

也见 [Number.MAX_SAFE_INTEGER（最大安全整数）](#numbermax_safe_integer最大安全整数)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[parseInt, parseFloat（解析数字）](#parseint-parsefloat解析数字)。

示例：[`12_numbers_and_math/05_number_methods.js`](12_numbers_and_math/05_number_methods.js)

### Math Object（Math 对象）

`Math` 是**内置的静态命名空间对象**，不能被 `new`，也不该被当作构造函数（它没有 `[[Construct]]`）。常用部分：常量 `Math.PI`、`Math.E`、`Math.LN2`；取整 `floor`/`ceil`/`round`/`trunc`；幂与根 `pow`、`sqrt`、`cbrt`、`hypot`；三角与对数 `sin`/`cos`/`log`/`log2`/`log10`；最值与符号 `min`/`max`/`abs`/`sign`；以及 `Math.random`。几个实用细节：`Math.max(...arr)` 是数组求最大值的惯用法，但**元素太多会爆栈**（用 `reduce` 更稳）；`Math.min()`/`Math.max()` 不传参数分别返回 `Infinity`/`-Infinity`；`Math.round` 对负数的「四舍五入」是**朝 +∞ 方向**的（`Math.round(-0.5)` 是 `-0`，不是 `-1`）；ES6 的 `Math.sign`/`trunc`/`cbrt`/`hypot` 在老环境需转译。

也见 [Rounding（取整）](#rounding取整)、[Math.random（随机数）](#mathrandom随机数)。

示例：[`12_numbers_and_math/01_math_object.js`](12_numbers_and_math/01_math_object.js)

### Rounding（取整）

四种取整方式的方向各不相同，选择错了就是业务事故：`Math.floor(x)` 向 **-∞** 取整（向下），`Math.ceil(x)` 向 **+∞** 取整（向上），`Math.trunc(x)` **去掉小数部分**（向 0 取整），`Math.round(x)` 取**最接近的整数**（`.5` 向 +∞ 舍入）。负数是最容易搞混的：`Math.floor(-2.5)` 是 `-3` 而 `Math.trunc(-2.5)` 是 `-2`；`Math.round(-2.5)` 是 `-2`。分页计算「共 10 条每页 3 条需几页」用 `Math.ceil(total / size)`；「第几页」用 `Math.floor(i / size)`（等价于 `Math.trunc` 在正数下的结果）。**需保留 N 位小数**时不能用 `Math.round(x * 100) / 100` 直接了事——`x * 100` 本身就会引入浮点误差，见 `toFixed` 与精度处理。另外要区分 `toFixed`（返回字符串）与 `toPrecision`（按有效数字）。

也见 [toFixed（定点格式化）](#tofixed定点格式化)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[Intl.NumberFormat（本地化数字格式化）](#intlnumberformat本地化数字格式化)。

示例：[`12_numbers_and_math/02_rounding.js`](12_numbers_and_math/02_rounding.js)

### toFixed（定点格式化）

`num.toFixed(digits)` 把数字格式化成**保留 N 位小数**的**字符串**（注意返回类型是 `string` 而不是 `number`，这才是它最常被误用的地方）。它按「四舍五入」的名义工作，实际行为以数字的**二进制真值**为准，所以 `(1.005).toFixed(2)` 得到 `'1.00'` 而不是 `'1.01'`——因为 `1.005` 在二进制里其实略小于 1.005。可靠的做法是先转成整数运算，或用 `Intl.NumberFormat` 的 `roundingMode`（`'halfExpand'`/`'halfEven'` 等，见 `12_numbers_and_math/09_locale_format_and_rounding.js`）。其他细节：`digits` 超出 0~100 会抛 `RangeError`；省略参数等价于 `toFixed(0)`；结果是**字符串**，要继续计算必须 `Number(...)` 转回来，而 `'1.00'` 转回数字会丢掉尾随零。展示金额时它可用，**计算金额时绝不能依赖它**。

也见 [Rounding（取整）](#rounding取整)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[Intl.NumberFormat（本地化数字格式化）](#intlnumberformat本地化数字格式化)。

示例：[`12_numbers_and_math/02_rounding.js`](12_numbers_and_math/02_rounding.js)

### Math.random（随机数）

`Math.random()` 返回 `[0, 1)` 区间内的**伪随机**浮点数（含 0、不含 1），无参数、**无法指定种子**，因此结果不可复现、也不能用于安全场景（密码、令牌、抽奖密钥必须用 `crypto.getRandomValues`）。几个必须记牢的公式：任意范围浮点 `min + Math.random() * (max - min)`；任意范围**整数（含两端）** `Math.floor(Math.random() * (max - min + 1)) + min`；随机取数组元素 `arr[Math.floor(Math.random() * arr.length)]`。关键细节：取整数**必须用 `Math.floor` 而不是 `Math.round`**，否则两端的概率会变成中间值的一半（经典偏差 bug）；区间的**左闭右开**性质意味着公式里的 `+1` 决定能否取到 `max`。需要可复现的随机（测试、游戏回放）要自己实现带种子的 PRNG。

也见 [Shuffle（洗牌算法）](#shuffle洗牌算法)、[Rounding（取整）](#rounding取整)。

示例：[`12_numbers_and_math/03_random.js`](12_numbers_and_math/03_random.js)

### Shuffle（洗牌算法）

把数组随机打乱的标准做法是 **Fisher-Yates（Knuth）洗牌**：从后往前遍历，对每个位置 `i` 取一个 `[0, i]` 范围内的随机下标 `j`，交换 `arr[i]` 与 `arr[j]`。它的关键在于「每个位置只与**已处理范围内**的位置交换」，这样能得到**均匀分布**的全部排列。常见的错误写法是 `arr.sort(() => Math.random() - 0.5)`：它看起来简洁，但依赖 `sort` 的比较函数自洽性，而随机比较函数**不自洽**，实际分布并不均匀（不同引擎结果差异明显），而且取决于排序算法内部实现。另一类常见错误是「随机取一个元素 push 到新数组并从原数组删除」，复杂度 O(n²) 且容易写错。实现细节：随机下标要用 `Math.floor(Math.random() * (i + 1))`，**上界是 `i+1`** 而不是 `arr.length`，用错就破坏均匀性。

也见 [Math.random（随机数）](#mathrandom随机数)、[Comparator（比较函数）](#comparator比较函数)。

示例：[`12_numbers_and_math/03_random.js`](12_numbers_and_math/03_random.js)

### parseInt, parseFloat（解析数字）

两条「从字符串里解析数字」的路径，与 `Number()` 的严格转换形成三种不同行为。`parseInt(str, radix)` **从左往右解析到第一个非法字符为止**：`parseInt('12px')` 得到 `12`、`parseInt('abc')` 得到 `NaN`；`radix` 是**进制**（2~36），**必须显式传 10**——不传时历史规则会根据前缀猜（`'0x10'` 按 16 进制得到 16），这是老代码里最难查的 bug 之一。`parseFloat(str)` 同理但支持小数，**没有进制参数**，遇到第二个小数点或 `e` 之外的字符就停。对比 `Number('12px')` 得到 `NaN`（整个字符串必须合法）、`Number('')` 得到 `0`（而 `parseInt('')` 是 `NaN`）。最常见的误用是把它们直接当回调传：`['1','2','3'].map(parseInt)`。

也见 [Callback Signature Pitfall（回调签名陷阱）](#callback-signature-pitfall回调签名陷阱)、[Number（数值类型）](#number数值类型)、[toFixed（定点格式化）](#tofixed定点格式化)。

示例：[`12_numbers_and_math/04_parseint_parsefloat.js`](12_numbers_and_math/04_parseint_parsefloat.js)

### Intl.NumberFormat（本地化数字格式化）

`Intl.NumberFormat` 是按**区域与语言**格式化数字的标准工具，能一行搞定千分位、货币符号、百分比、单位、小数位与舍入模式，比手写 `toFixed` + 正则拼接可靠得多。基本用法：`new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(1234.5)`；`style` 可取 `'decimal'`/`'currency'`/`'percent'`/`'unit'`；`useGrouping` 控制千分位；`minimumFractionDigits`/`maximumFractionDigits` 控制小数位。三个关键细节：ES2023 起支持 **`roundingMode`**（`'halfExpand'` 四舍五入、`'halfEven'` 银行家舍入等），这是语言内置的、不受二进制浮点误差影响的正规舍入方案；构造 `Intl.NumberFormat` 实例**开销较大**，循环格式化时应**复用同一个实例**而不是每次 `new`；`format` 的结果是**字符串**，且受运行环境的 ICU 数据影响，跨环境可能略有差异。完整用法见 `33_intl/`。

也见 [toFixed（定点格式化）](#tofixed定点格式化)、[Rounding（取整）](#rounding取整)、[localeCompare（本地化比较）](#localecompare本地化比较)。

示例：[`12_numbers_and_math/07_intl_number_format.js`](12_numbers_and_math/07_intl_number_format.js)、[`12_numbers_and_math/09_locale_format_and_rounding.js`](12_numbers_and_math/09_locale_format_and_rounding.js)

### Floating Point Precision（浮点精度）

浮点精度问题不是 JS 的 bug，而是 **IEEE 754 双精度二进制浮点**的固有性质：像 `0.1`、`0.2`、`0.3` 这样的十进制小数在二进制里是**无限循环小数**，只能被近似存储，所以 `0.1 + 0.2 === 0.30000000000000004`。工程上有四种解法：**放大取整**（`Math.round(x * 10**n) / 10**n`，注意乘法本身也可能引入误差，可用 `Number(`${x}e${n}`)` 规避）；**整数分表示**（金额一律以「分」为单位存整数，只在展示时除 100，这是电商系统的通行做法）；**十进制字符串运算**（引入 decimal 库，任意精度但慢）；**容差比较**（不算精确相等，用 `Math.abs(a - b) < 容差`）。关键判断标准：涉及**金额、库存、税额**时不要用「看起来能跑」的浮点方案，必须在数据进入计算前就定好单位与精度策略。

也见 [Number.EPSILON（机器精度）](#numberepsilon机器精度)、[Number.MAX_SAFE_INTEGER（最大安全整数）](#numbermax_safe_integer最大安全整数)、[toFixed（定点格式化）](#tofixed定点格式化)。

示例：[`12_numbers_and_math/08_precision_handling.js`](12_numbers_and_math/08_precision_handling.js)、[`12_numbers_and_math/06_number_limits.js`](12_numbers_and_math/06_number_limits.js)

### Number.EPSILON（机器精度）

`Number.EPSILON` 等于 2⁻⁵² ≈ 2.220446049250313e-16，是「1 与**大于 1 的最小可表示数**之间的差」，也就是双精度浮点在 1 附近的**间距（机器精度）**。它的标准用途是**浮点容差比较**：`Math.abs(a - b) < Number.EPSILON` 用来判断「两个数是否足够接近」。关键细节：EPSILON 是**针对 1 附近的绝对间距**，对数量级大的数（如 `1e16`）它太小、对很小的数它又太大，所以更稳妥的写法是按量级缩放：`Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))`，或直接使用业务容差（金额场景用 0.005 这样的「半分钱」）。它**不是**「万能精度保证」，也不能用来做「精确相等」——`0.1 + 0.2 - 0.3` 的结果约 5.5e-17，虽小于 EPSILON，但量级稍大的场景（如 `0.3 - 0.2 - 0.1`）就会超。

也见 [Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[Number（数值类型）](#number数值类型)。

示例：[`12_numbers_and_math/06_number_limits.js`](12_numbers_and_math/06_number_limits.js)

### Number.MAX_SAFE_INTEGER（最大安全整数）

`Number.MAX_SAFE_INTEGER` 是 2⁵³-1 = **9007199254740991**，含义是「**能保证唯一且精确表示的整数上限**」：超过它之后 `n` 与 `n + 1` 可能算成同一个值，整数运算会**静默丢精度**（不抛错、不警告）。判断某个值能否安全当整数用，要用 `Number.isSafeInteger(x)`（它同时判断「是整数」和「在安全范围内」，两个条件都满足才为 `true`）。最现实的后果是：**后端用雪花算法生成的 19 位 id 直接 `JSON.parse` 会丢掉后几位**，所以业界约定大整数 id 必须以**字符串**形式传输，前端全程当字符串处理（或改用 `BigInt`）。相关边界还有 `Number.MAX_VALUE`（约 1.8e308，超过就是 `Infinity`）和 `Number.MIN_VALUE`（5e-324，更小的正数下溢成 0）。

也见 [Number（数值类型）](#number数值类型)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)。

示例：[`12_numbers_and_math/06_number_limits.js`](12_numbers_and_math/06_number_limits.js)
