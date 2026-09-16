# 术语表分册 07 —— 迭代器生成器、异步、模块化、错误处理、JSON

> 覆盖目录：`17_iterators_and_generators`、`18_async`、`19_modules`、`20_error_handling`、`21_json`
> 文中所有示例链接均指向仓库中真实存在的文件，可点击查看可运行代码。

---

## 迭代器与生成器

### Iterable Protocol（可迭代协议）

一条约定：只要一个对象身上有名为 `Symbol.iterator` 的方法，并且这个方法**返回一个迭代器**，这个对象就是「可迭代的（iterable）」。它解决的是「遍历方式不统一」的问题——ES6 之前数组用索引循环、对象用 `for...in`、类数组用 `slice.call`，各有各的写法；有了这条协议，`for...of`、展开运算符 `...`、解构 `[a, b] = x`、`Array.from(x)`、`new Set(x)`、`yield*` 就都能用同一套语法消费任意数据结构。**关键细节**：判断一个值能否被 `for...of` 遍历，标准做法是 `typeof obj[Symbol.iterator] === 'function'`；字符串、数组、Map、Set、TypedArray、`arguments`、生成器对象都天然满足这条协议，而**普通对象 `{}` 不满足**，所以 `for (const x of {a: 1})` 会抛 `TypeError: obj is not iterable`。常见误解是「可迭代 = 能遍历」，准确说法是「可迭代 = 能被 `for...of` 这类语法按协议消费」。

示例：[`17_iterators_and_generators/01_iterable_protocol.js`](17_iterators_and_generators/01_iterable_protocol.js)

### Symbol.iterator

`Symbol.iterator` 是一个内置的 **symbol 值**，被用作可迭代对象的「方法名」。它必须是这个 symbol，写成字符串 `'iterator'` 或用别的 symbol 都不生效——这正是它区别于普通属性的地方：它不会被 `for...in`、`Object.keys`、`JSON.stringify` 看到，也就不会污染对象的「数据面」。它还可以自定义：给自家类型挂上 `[Symbol.iterator]()`，你的对象就能直接被 `for...of` 和解构使用。常见的坑是把它定义成属性（值）而不是方法（函数），或者写成箭头函数后 `this` 指向出错。也见 Iterable Protocol（可迭代协议）、Symbol.asyncIterator。

示例：[`17_iterators_and_generators/03_custom_iterable.js`](17_iterators_and_generators/03_custom_iterable.js)

### Iterator Protocol（迭代器协议）

迭代器协议规定：一个「迭代器」是一个拥有 `next()` 方法的对象，`next()` 每次调用都返回一个形如 `{ value, done }` 的结果对象。它是「怎么取下一个值」的约定，与「谁可以被遍历」的可迭代协议是一对搭档——前者管动作，后者管资格。`for...of` 的循环体本质上就是在反复调用 `iter.next()`，直到 `done` 为 `true`。注意 `next()` 的返回值必须是对象，如果返回原始值会触发 `TypeError: Iterator result ... is not an object`。

示例：[`17_iterators_and_generators/02_iterator_protocol.js`](17_iterators_and_generators/02_iterator_protocol.js)

### Iterator Result Object（迭代器结果对象）

`{ value, done }` 是 `next()` 的返回格式：`value` 是本次取到的值，`done` 表示「是否已取完」。**关键细节**：当 `done` 为 `true` 时，`value` 通常被忽略——但生成器的 `return` 语句可以让 `done: true` 的同时带回一个「最终值」（`{ value: 42, done: true }`）。另一个容易忽略的点是：一旦 `done` 变成 `true`，后续再调用 `next()` 会**永远**返回 `{ value: undefined, done: true }`，不会复活。`done` 只在被读取时才会被 `for...of` 检查，因此惰性序列可以一直不产出 `done`。

示例：[`17_iterators_and_generators/02_iterator_protocol.js`](17_iterators_and_generators/02_iterator_protocol.js)

### Iterable vs Iterator（可迭代对象与迭代器）

两者常常由同一个对象同时扮演，但概念不同：**可迭代对象**拥有 `[Symbol.iterator]()`（是「可被遍历的容器」），**迭代器**拥有 `next()`（是「遍历过程中记录游标的那只手」）。`[Symbol.iterator]()` 的典型实现是**返回一个新迭代器**，这样同一个数组可以同时被两个 `for...of` 独立遍历而不互相干扰。数组本身是「可迭代但**不是**迭代器」——它没有 `next()`；而生成器对象**两者都是**（自身有 `next()`，`[Symbol.iterator]()` 又返回 `this`）。这只是巧妙的双重身份，不代表所有迭代器都天然可迭代。也见 One-shot Consumption（一次性消费）。

示例：[`17_iterators_and_generators/03_custom_iterable.js`](17_iterators_and_generators/03_custom_iterable.js)

### One-shot Consumption（一次性消费）

迭代器是「**一次性**」的：游标一旦走到末尾，就无法重置，再遍历只能向容器要一个新的迭代器。所以 `for (const x of iter)` 之后紧接着再来一次 `for (const x of iter)`（这里 `iter` 本身就是迭代器）会一个元素都拿不到；而 `for (const x of arr)` 写两次却没问题，因为数组每次都会通过 `[Symbol.iterator]()` 生产**新的**迭代器。这是从数组/Map 迁移到「手写迭代器」时最常见的踩坑点。修法是遍历容器而不是遍历迭代器，或者把 `[Symbol.iterator]()` 实现成每次返回新对象。

示例：[`17_iterators_and_generators/02_iterator_protocol.js`](17_iterators_and_generators/02_iterator_protocol.js)

### Generator Function（生成器函数）

用 `function*`（或对象/类里的 `*method()`、`async function*`）声明的函数，调用它**不会执行函数体**，而是立刻返回一个生成器对象。函数体的执行被 `yield` 切成一段段，由调用方通过 `next()` 一段一段地推进。这是语言层面内置的「状态机 + 迭代器工厂」，省掉了手写 `{ value, done }` 的样板代码。注意 `function *foo`、`function* foo`、`*foo()` 写法都合法，风格统一即可；生成器函数不能用 `new` 调用。

示例：[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### yield

`yield` 是生成器里「暂停并交出一个值」的关键字，它把控制权交回调用方，并把右侧表达式的值作为 `{ value, done: false }` 送给 `next()`。与 `return` 不同，`yield` 之后函数**还能继续**执行；恢复时会从暂停处接着往下跑。**常见误解**：以为 `yield` 像 `return` 一样结束函数——实际上只有 `return`（或函数体结束、或 `generator.return()`）才真正终止。`yield` 还是一个**表达式**，本身有值，这个值正是下一次 `next(v)` 的实参，这也是双向通信的基础。也见 Two-way Communication（双向通信）。

示例：[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### Generator Object（生成器对象）

调用生成器函数得到的返回值，它同时满足迭代器协议（有 `next()`）和可迭代协议（`[Symbol.iterator]()` 返回 `this`），所以既能 `gen.next()` 手动推进，也能 `for...of` 自动消费。它内部保存着完整的执行上下文（局部变量、暂停位置），这些局部变量对外界完全不可见，天然就是「私有状态」。一个细节：生成器对象第一次 `next()` 之前函数体一行都没跑，且**首个 `next()` 的实参会被丢弃**（因为此时还没有任何 `yield` 表达式在等待接收）。

示例：[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### yield* Delegation（yield* 委托）

`yield* iterable` 把「继续产出」的工作**委托**给另一个可迭代对象，依次把它的每个值原样转发出去，直到它耗尽。它常用于三处：递归遍历树结构（`yield* traverse(child)`）、拼接多个序列、以及复用另一个生成器的产出。**关键细节**：`yield*` 的求值结果是**被委托迭代器的最终返回值**（即它 `done: true` 时带的 `value`），因此 `const r = yield* inner()` 能拿到 `inner` 里 `return` 的值。不要把它和 `yield` 混用——`yield anotherGenerator()` 只会吐出整个生成器对象本身，不会展开。

示例：[`17_iterators_and_generators/06_generator_delegation.js`](17_iterators_and_generators/06_generator_delegation.js)

### Two-way Communication（生成器双向通信）

生成器不只是「往外吐值」，还能「往里收值」：`gen.next(v)` 的实参 `v` 会成为**上一个暂停的 `yield` 表达式的求值结果**。于是 `const received = yield sent` 这一行同时完成了「送出 `sent`」与「接收 `received`」两件事，形成双向通道。这是实现「协程 / 类 co 库驱动器」的机制：生成器 `yield` 一个 Promise，外部驱动器 `await` 之后把结果通过 `next(结果)` 送回去。**注意**：正向迭代（`for...of`）传进去的永远是 `undefined`，双向通信必须手动调 `next`。也见 yield。

示例：[`17_iterators_and_generators/05_generator_two_way.js`](17_iterators_and_generators/05_generator_two_way.js)

### Generator.return() / Generator.throw()

这两个方法让你**从外部**干预生成器内部：`gen.return(v)` 立即终止生成器，并让当前暂停的 `yield` 处「收到」一个 `return` 语句的效果，返回 `{ value: v, done: true }`，同时会执行生成器里的 `finally` 块（这是清理资源的钩子）；`gen.throw(err)` 则把错误**注入到暂停点**，表现得像该 `yield` 处抛出了异常，可被生成器内部的 `try...catch` 捕获。若生成器内部没有捕获，错误会向外传播到调用 `throw()` 的地方。这是「协程可被外部取消/注入错误」的基础，也是 `for...of` 提前 `break` 时自动调用 `return()` 的原因。也见 Generator Object（生成器对象）。

示例：[`17_iterators_and_generators/07_generator_throw_return.js`](17_iterators_and_generators/07_generator_throw_return.js)

### Lazy Evaluation（惰性求值）

惰性求值指「值在被真正需要时才计算」，而不是一次性全部算完。生成器天然惰性：`for (const x of gen)` 每循环一次才推进一步，`take(3)` 之后剩余元素根本不会被计算。相比 `map`/`filter` 会先产生完整中间数组，惰性链在「元素计算代价高」或「数据量巨大」时能省下数量级的算力与内存。**常见误解**：以为惰性等于「异步」或「并行」——它只是「推迟 + 按需」，跟时间维度无关，计算仍然发生在当前同步流程里。

示例：[`17_iterators_and_generators/08_infinite_lazy_sequences.js`](17_iterators_and_generators/08_infinite_lazy_sequences.js)

### Infinite Sequence（无限序列）

用生成器里的 `while (true) { yield ... }` 可以描述一个永不结束的序列（自然数、斐波那契、不断变化的时间戳）。它之所以不会卡死，正因为惰性：只要消费方不无限地 `next()`，函数就永远停在 `yield` 处。反过来，**千万不要**对无限序列做 `[...gen]`、`Array.from(gen)` 或 `for...of` 不带 `break` 的遍历——那会立刻耗尽内存或死循环。正确姿势是配合 `take`/`break`/`for...of` + 提前退出，或者用迭代器助手 `.take(n)`。

示例：[`17_iterators_and_generators/08_infinite_lazy_sequences.js`](17_iterators_and_generators/08_infinite_lazy_sequences.js)

### Async Iterator（异步迭代器）

同步迭代器的「异步镜像」：`next()` 返回的不再是 `{ value, done }`，而是 **`Promise<{ value, done }>`**。它专门服务于「下一个值需要等待」的数据源——分页接口、文件流、WebSocket 消息、数据库游标。用 `async function*` 声明的异步生成器同时满足异步迭代器与异步可迭代两个协议，内部既能 `await` 也能 `yield`。注意异步迭代器的 `next()` **总是**返回 Promise，即使值是现成的，也需要 `await` 才能拿到。

示例：[`17_iterators_and_generators/09_async_iterator.js`](17_iterators_and_generators/09_async_iterator.js)

### Symbol.asyncIterator

异步可迭代协议的方法名，相当于异步世界的 `Symbol.iterator`：对象上挂 `[Symbol.asyncIterator]()` 并返回异步迭代器，就能被 `for await...of` 消费。它与 `Symbol.iterator` 可以**共存**于同一个对象（一个供同步遍历、一个供异步遍历），`for await...of` 会优先找 `Symbol.asyncIterator`，找不到时**回退**到 `Symbol.iterator`（把每个同步值当成已兑现的 Promise 处理）。这也是为什么同步数组也能被 `for await` 遍历。也见 Symbol.iterator、for await...of。

示例：[`17_iterators_and_generators/09_async_iterator.js`](17_iterators_and_generators/09_async_iterator.js)

### for await...of

专门消费异步可迭代对象的循环语法，每一轮自动 `await` 一次 `next()` 的结果，让「等待下一个值」对代码透明。循环体内可以正常写 `await`，且各轮之间**严格串行**——上一轮处理完才请求下一个值，这对有顺序要求的分页拉取是必要的，但追求吞吐时要注意它并不并行。常见坑：在普通 `for...of` 里遍历异步迭代器只会拿到一堆 Promise；以及忘记 `for await` **只能在 `async` 函数（或模块顶层）中使用**。

示例：[`17_iterators_and_generators/09_async_iterator.js`](17_iterators_and_generators/09_async_iterator.js)

### Array.fromAsync（异步转数组）

`Array.fromAsync(iterableOrAsyncIterable)` 是 ES2025 新增的静态方法，把「异步可迭代对象」或「含 Promise 的可迭代对象」转成一个**数组**，返回 `Promise<Array>`。它是 `Array.from` 的异步版本，等价于「`for await...of` 逐个 push 再 resolve」，但写起来一行搞定，且对类数组做长度校验更严格。注意它**会等到全部元素就绪**才兑现，因此不能用于无限或超长流——那种场景应当用 `for await...of` 边读边处理。也见 for await...of、Iterator Helpers（迭代器助手）。

示例：[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### Iterator Helpers（迭代器助手，ES2025）

ES2025 给迭代器补上的 `map`/`filter`/`take`/`drop`/`flatMap`/`reduce`/`toArray`/`forEach`/`some`/`every`/`find`，外加静态方法 `Iterator.from()`。与数组方法最大的区别是：**它们返回的还是迭代器，整条链是惰性的**，只有最终调用 `toArray()`/`reduce()`/`forEach()`（或 `for...of`）时才真正开始消费。这让「读 10GB 日志」「无限序列」「要多少取多少」成为可行——数组方法必须先把所有元素装进内存。**关键细节**：`take(3)` 拿够就停，后面的元素根本不会计算；而 `Iterator.from()` 能在任意可迭代对象/迭代器上开出一条可链式调用的助手流。

示例：[`34_modern_es_features/05_es2025_iterator_helpers.js`](34_modern_es_features/05_es2025_iterator_helpers.js)

---

## 异步编程

### Synchronous vs Asynchronous（同步与异步）

同步指代码**按书写顺序**一条条执行，前一条没结束，后一条不会开始；异步指任务被「托管」出去，主线程不等它完成就继续往下跑，等结果就绪后再通过回调/Promise 回到你的代码。异步不是为了「更快」，而是为了**不阻塞**：网络、磁盘、定时器等 I/O 的耗时远大于 CPU 运算，同步等待会让整个线程白白空转。判断一段代码是同步还是异步，看它是否「立刻返回一个占位的凭证（回调注册/Promise）」而不是最终结果。

示例：[`18_async/01_synchronous_vs_asynchronous.js`](18_async/01_synchronous_vs_asynchronous.js)

### Blocking vs Non-blocking（阻塞与非阻塞）

阻塞描述的是**调用方**的处境：调用一个函数后线程被占住、无法做别的事就是阻塞，立刻拿回控制权就是非阻塞。二者与「同步/异步」是同一枚硬币的两面——同步阻塞（`fs.readFileSync`、忙等循环）、异步非阻塞（`fs.readFile` 回调、`fetch`）是常见组合，但也有同步非阻塞（读缓存命中就立刻返回）与异步阻塞（其实很少见）的微妙情形。浏览器/Node 主线程一旦被长同步任务阻塞，页面会掉帧、事件循环无法推进，所以重计算要交给 Worker 或切片处理。

示例：[`18_async/01_synchronous_vs_asynchronous.js`](18_async/01_synchronous_vs_asynchronous.js)

### Event Loop（事件循环）

JavaScript 运行时（浏览器 / Node）的调度核心：它反复执行「取一个**宏任务** → 执行到调用栈清空 → **清空微任务队列** → 必要时渲染 → 再取下一个宏任务」这个循环。它是 JavaScript「单线程却能处理并发 I/O」的根本原因——耗时操作由宿主环境（浏览器内核、libuv 线程池）在别处完成，只把「回调该执行了」的消息放进队列。理解事件循环就能解释绝大多数「为什么输出顺序和我写的不一样」的困惑。也见 Macrotask（宏任务）、Microtask（微任务）。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### Call Stack（调用栈）

记录「当前正在执行哪些函数、执行到哪一行」的后进先出结构，每进入一个函数就压一帧，返回就弹一帧。栈空是事件循环取下一个任务的**前提条件**——只要栈里还有代码在跑，任何队列里的回调都只能干等。这点解释了两个现象：同步死循环会让页面完全无响应（栈永远不空）；以及 `setTimeout(fn, 0)` 并不会「立刻」执行，最短也要等当前整段同步代码跑完。栈溢出（`RangeError: Maximum call stack size exceeded`）则是栈帧太多的直接后果。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### Task Queue（任务队列）

事件循环用来存放「待执行回调」的队列统称。现代的准确描述是**两条队列**：宏任务队列（task queue，也叫 macrotask queue）与微任务队列（microtask queue），并且事件循环每轮只取一个宏任务、却会把微任务队列**清空**。定时器到期、I/O 完成、用户事件、`setTimeout` 的回调都进宏任务队列，`Promise.then`、`queueMicrotask`、`await` 之后的续体进微任务队列。**常见误解**：把「任务队列」想成一条先来先服务的队列——两条队列的优先级差异才是所有执行顺序问题的根源。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### Macrotask（宏任务）

宏任务是事件循环中**每轮只执行一个**的任务单元，来源包括 `setTimeout`/`setInterval` 的回调、I/O 完成回调、`setImmediate`（Node）、UI 事件与消息事件（浏览器）。每个宏任务执行完、调用栈清空后，运行时会**彻底清空微任务队列**才去取下一个宏任务。所以「宏任务之间会插入微任务」，这也是「同一次事件循环里定时器并不精确」的原因——前面的任务拖久了，后面的回调就会延后。也见 Microtask（微任务）。

示例：[`18_async/12_microtask_vs_macrotask.js`](18_async/12_microtask_vs_macrotask.js)

### Microtask（微任务）

在当前宏任务结束后、**下一个宏任务开始前**被清空的队列，`Promise.then`、`queueMicrotask`、`await` 之后的代码都进入这里。关键结论：**微任务队列会一直被清空到空为止才轮到下一个宏任务**——所以在微任务里无限递归添加微任务会让事件循环永远到不了下一个宏任务，页面直接卡死。这也是「为什么 `Promise.then` 比 `setTimeout(0)` 先执行」的答案。也见 Macrotask（宏任务）、Microtask Starvation（微任务饥饿）。

示例：[`18_async/12_microtask_vs_macrotask.js`](18_async/12_microtask_vs_macrotask.js)

### Microtask Starvation（微任务饥饿）

当微任务不断产生新的微任务时，微任务队列永远清不空，宏任务（定时器、I/O、渲染）就永远排不上，现象是页面卡死、定时器完全不走。典型写法是「在 `then` 里再 `Promise.resolve().then(...)`」形成的无限递归，而且它比同步死循环更隐蔽：UI 可能先渲染一帧再冻结，日志也仍在滚动。正确做法是把长任务切片并主动让出——用 `setTimeout`/`setImmediate` 把下一片放回宏任务队列，让事件循环有机会处理别的任务。也见 Microtask（微任务）、setImmediate。

示例：[`18_async/12_microtask_vs_macrotask.js`](18_async/12_microtask_vs_macrotask.js)

### process.nextTick

Node 专有的调度 API，把回调放进一个**优先级高于 Promise 微任务**的 `nextTick` 队列，在「当前操作结束、事件循环继续之前」清空。它常用于「构造函数里不能立刻触发事件，要等调用方挂好监听器之后再触发」这类需要「延迟到当前栈退出但尽量早」的场景。**注意**：`nextTick` 队列同样会被清空到空，递归调用会饿死 I/O 与定时器（比微任务饥饿更早发生）。它是 Node 特有 API，浏览器里不存在，跨端代码应当用 `queueMicrotask`。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### setImmediate

Node 中把回调放到**事件循环的 check 阶段**执行的 API，语义是「当前轮 I/O 处理完之后尽快执行」，在 I/O 回调内部它通常**先于** `setTimeout(fn, 0)` 触发。它和 `setTimeout(0)` 都属于宏任务，但属于不同阶段，因此顺序在 Node 里并不像浏览器那样确定。**常见误解**：以为 `setImmediate` 是「立即同步执行」——它只是比 `setTimeout(0)` 更可预期地早一点。浏览器没有这个 API，可改用 `MessageChannel` 或 `setTimeout(0)` 模拟。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### Callback Function（回调函数）

把函数作为参数传给另一个函数，由后者在「合适的时机」调用，这就是回调。它是 JavaScript 最早的异步表达方式（`fs.readFile`、`addEventListener`），也是异步的「最低层原语」——Promise 与 `async/await` 都是在它之上做的封装。回调的 `this`、调用时机、被调用几次都是控制反转的风险点，所以约定「回调必须恰好调用一次」。也见 Error-first Callback（错误优先回调）、Callback Hell（回调地狱）。

示例：[`06_functions/09_callback_pattern.js`](06_functions/09_callback_pattern.js)

### Callback Hell（回调地狱）

多层异步操作层层嵌套，形成「向右的三角形」，可读性、错误处理与流程控制同时崩塌：错误要在每一层分别判断，循环、并发、提前退出都难以表达，变量作用域层层嵌套还容易出错。它不是「回调」的错，而是「用回调表达顺序流程」的必然结果。解法是采用可组合的抽象——Promise、`async/await`，让异步代码重新变成线性的。

示例：[`18_async/03_callback_hell.js`](18_async/03_callback_hell.js)

### Promise（承诺对象）

一个代表「未来某个时刻才会有结果」的占位对象，把「注册回调」的时机与「结果产生」的时机解耦。它带来三个实质收益：可链式组合（`then` 返回新 Promise，天然扁平化）、错误可被统一 `catch`、以及可被 `await` 以同步写法表达。**常见误解**：认为 Promise 本身就是异步的——`new Promise(executor)` 里的 executor 是**立刻同步执行**的，只有 `then`/`catch` 中的回调才被排入微任务队列。也见 Executor（执行器函数）、Promise States（Promise 的三种状态）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Promise States（Promise 的三种状态）

Promise 内部只有三种状态：`pending`（进行中）、`fulfilled`（已兑现）、`rejected`（已拒绝）。**状态不可逆**：一旦从 `pending` 变成 fulfilled 或 rejected，就永远定型，再次调用 `resolve`/`reject` 会被静默忽略（第一次调用生效）。这种「一次性」保证了结果不会自相矛盾，也让「防止重复回调」这类防御代码变得不必要。注意 `fulfilled` 常被口语称作 resolved，但严格意义上 `resolved` 包含「被另一个 Promise 接管」的情形。也见 Settled（已敲定）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Settled（已敲定）与状态不可逆

`settled` 是 `fulfilled` 与 `rejected` 的合称，意思是「已经不再变化」。与之对应的是 `Promise.prototype.finally()`：无论敲定为哪一边都会执行，且不接收任何参数。状态不可逆带来一条重要的实践结论：**取消一个 Promise 是不可能的**——你能做的是「不再理会它的结果」（配合 `AbortController` 通知底层操作停止），或把结果包一层再做「是否仍然有效」的判断。也见 AbortController / AbortSignal、Promise States（Promise 的三种状态）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Executor（执行器函数）

`new Promise(executor)` 里的那个函数，接收 `resolve` 与 `reject` 两个参数。**关键细节**：executor 是**同步立即执行**的，不是等某个时机才跑；而且 Promise 构造函数会「吃掉」executor 内同步抛出的异常，自动把 Promise 转为 rejected——所以 `new Promise(() => { throw new Error('x') })` 不会让程序崩溃，只会得到一个拒绝的 Promise。反过来说，在 executor 里 `setTimeout` 抛出异常则**不会**被捕获，因为那时已经不是 executor 的同步执行期了。这也解释了「为什么 `Promise` 构造函数里不能 return 值」。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### then / catch / finally

三者是 Promise 的三个消费入口：`then(onFulfilled, onRejected)` 处理成功（第二个参数也能处理失败，但只捕获**上游**的拒绝，不捕获同层 `onFulfilled` 抛出的错误，因此实践中更推荐用 `catch`）；`catch(onRejected)` 等价于 `then(undefined, onRejected)`，放在链尾可捕获整条链上的任何拒绝；`finally(onFinally)` 无论成败都执行，且**不接收参数、不改变结果**（除非它自己抛错或返回被拒绝的 Promise）。三者都返回**新的 Promise**，这正是可以链式调用与继续 `catch` 的原因。也见 Promise Chaining（链式调用）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Promise Chaining（链式调用）

每个 `then`/`catch`/`finally` 都返回一个新 Promise，把回调的返回值「接到」新 Promise 上，从而形成扁平链条而不是嵌套金字塔。**扁平化的关键**：如果回调返回的是 Promise，新 Promise 会**跟随**它（等它敲定后再以相同的值/理由敲定），而不是把 Promise 对象本身当作值传下去。若回调返回普通值，则新 Promise 立刻以该值兑现。这套规则让「串行异步步骤」写起来像一条流水线。也见 Value Pass-through（值穿透）。

示例：[`18_async/05_promise_chaining.js`](18_async/05_promise_chaining.js)

### Value Pass-through（值穿透）

链条上「没有处理的环节」会自动把值/拒绝原样传递给下一个环节：`then(null)`、`then(undefined)`、`then(没返回值)` 都会让下游拿到 `undefined`，而**非函数实参**（如 `then(123)`）会被直接忽略，值照旧向下穿透。拒绝同理：链条中间没有 `catch`，拒绝会一直穿到最近的 `catch`（或最终变成 unhandledRejection）。理解穿透能避免「我明明没写返回却拿到了奇怪的值」和「catch 放太靠后导致吞掉不该吞的错误」这两类问题。

示例：[`18_async/05_promise_chaining.js`](18_async/05_promise_chaining.js)

### Promise Combinators（Promise 组合器）

四个静态方法，用途与失败语义各不相同：`Promise.all` 全部成功才成功、**任一失败即立刻失败**（其余结果被丢弃）；`Promise.allSettled` 从不拒绝，等全部敲定后返回每个的 `{status, value|reason}`，适合「批量任务都要跑完并汇报」；`Promise.race` 第一个**敲定**者说了算（无论成功还是失败）；`Promise.any` 第一个**成功**者说了算，全部失败则抛 `AggregateError`（内含所有拒绝理由）。**常见误解**：把 `race` 和 `any` 当同义词——区别就在「失败算不算数」。四者都会立刻返回 Promise 并同步挂载监听，因此**不要**把「组合器」当作并发控制手段，它们对传入的 Promise 数量没有任何限制。

示例：[`18_async/06_promise_combinators.js`](18_async/06_promise_combinators.js)

### async / await

`async` 函数总是返回 Promise（返回值被自动包装），`await` 在函数内部「暂停」当前执行，等右侧 Promise 敲定后恢复，并把兑现值作为表达式结果、把拒绝理由作为抛出异常。它是**基于生成器 + Promise 的语法糖**：`await` 之后的代码相当于被放进 `then` 的续体，也就是进入**微任务队列**。常见误解有两处：`await` 并不会阻塞整个线程（只暂停当前 async 函数，其它任务照常跑）；在 `for` 循环里 `await` 是**串行**的，想并行要先 `Promise.all` 或先收集 Promise 再 await。

示例：[`18_async/07_async_await_basics.js`](18_async/07_async_await_basics.js)

### Top-level await（TLA，顶层 await）

允许在**模块顶层**（而不是函数内部）直接写 `await`，让整个模块的求值过程异步化：依赖它的模块会等它敲定后才继续执行。它主要服务于「加载配置、建立连接、动态导入后再初始化」这类「模块初始化本身就异步」的场景。**使用限制**：只在 ES Module 顶层可用（CJS 与脚本里会报错），且过度使用会让依赖图变成串行的瀑布，拖慢启动——能并行的地方用 `Promise.all` 合并 await。也见 Dynamic import（动态导入）。

示例：[`19_modules/09_dynamic_import.js`](19_modules/09_dynamic_import.js)

### await 的暂停与恢复

`await v` 的语义可以拆成三步：把 `v` 用 `Promise.resolve` 包装；**暂停**当前 async 函数并让出线程；在 `v` 敲定后把「后续代码」作为一个**微任务**重新入队并恢复执行。因此 `await` 之后的那一行至少也要等到当前同步代码跑完——这意味着 `await` 一个已经兑现的普通值仍然会让出一次。**关键细节**：恢复的位置是「微任务队列」，所以 `await` 的续体排在 `setTimeout` 之前、排在已有的微任务之后。

示例：[`18_async/07_async_await_basics.js`](18_async/07_async_await_basics.js)

### Unhandled Rejection（未处理的拒绝）

一个被拒绝的 Promise 若在「本轮事件循环结束前」没有被任何 `catch`/`onRejected` 处理，宿主就会把它报为「未处理的拒绝」：浏览器触发 `unhandledrejection` 事件，Node 默认打印警告并可能终止进程。它是异步代码里最隐蔽的错误泄漏源——比如 `async` 函数里 `await` 抛错却无人 `catch`，或者写了 `Promise.reject(x)` 却没有链尾处理。实践中应在进程级兜底（Node 的 `process.on('unhandledRejection')` / 浏览器事件监听）做日志与净化，但兜底**不能替代**局部的错误处理。也见 Async Error Handling（异步错误处理）。

示例：[`18_async/08_async_error_handling.js`](18_async/08_async_error_handling.js)

### Concurrency Control（并发控制）

限制「同一时刻最多有多少个异步任务在跑」的机制，典型实现是一个上限为 N 的信号量与一个等待队列。它解决的是「`Promise.all` 一口气打出上千个请求」造成的下游打爆、文件描述符耗尽、内存暴涨。关键在于它是**调度**而非组合：组合器只关心结果聚合，不关心同时跑几个。Node 生态常用 `p-limit` 这类库，也可以几十行自己写一个。也见 Sequential vs Parallel（串行与并行）。

示例：[`18_async/15_async_patterns.js`](18_async/15_async_patterns.js)

### Sequential vs Parallel（串行与并行）

串行是「前一个 await 完再发下一个」，总耗时是各步之和；并行是「先同时发起，再用 `Promise.all` 汇总」，总耗时约等于最慢的那个。**关键区分点在「发起时机」**：`await a(); await b();` 是串行，`const [r1, r2] = await Promise.all([a(), b()]);` 才是并行。常见误区是在 `map` 里写 `await` 却误以为在并行，以及为了「保险」把所有步骤都串起来导致接口慢好几倍。判断标准是「后一步是否依赖前一步的结果」——不依赖就该并行。

示例：[`18_async/09_async_sequential_vs_parallel.js`](18_async/09_async_sequential_vs_parallel.js)

### Promise.withResolvers（ES2024）

一个静态方法，一次性返回 `{ promise, resolve, reject }` 三件套，省掉了「先把 `resolve` 存到外层变量再去构造 Promise」的别扭写法，也不用再写 `let resolve; new Promise(r => resolve = r)`。它最适合「Promise 的敲定时机由外部事件决定」的场景：把 `resolve` 交给事件监听器、把 `reject` 交给超时定时器、把装饰过的 Promise 交给别的模块消费。语义细节与 `new Promise` 一致：返回的 `promise` 也是新的 pending Promise，`resolve`/`reject` 也只能生效一次。也见 Executor（执行器函数）。

示例：[`18_async/11_promise_static_methods.js`](18_async/11_promise_static_methods.js)

### Promise.try（ES2025）

`Promise.try(fn)` 用 Promise 的方式运行 `fn`：无论 `fn` 是**同步抛出**还是**返回被拒绝的 Promise**，结果都统一成一个被拒绝的 Promise，从而可以接 `.catch`。它解决的是「混合错误源」的经典痛点——`Promise.resolve().then(() => fn())` 是常见的手工替代，但更啰嗦且容易写错。有了它，调用一个「既可能同步 throws、又可能异步 reject」的函数时，只需一处 `catch` 就能兜住。也见 Promise、Async Error Handling（异步错误处理）。

示例：[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### Timeout Control（超时控制）

给异步操作设一个「最长等待时间」，到点就放弃等待并抛出超时错误。常见实现是 `Promise.race([task, timeoutReject])`，或使用 `AbortSignal.timeout(ms)`。**关键细节**：超时只是「我不再等了」，被等待的操作**仍在后台继续运行**（除非同时传入了取消信号），因此要意识到资源可能仍在被消耗。另一个坑是超时后忘了清理定时器，导致进程迟迟不退出。

示例：[`18_async/13_timeout_and_abort.js`](18_async/13_timeout_and_abort.js)

### AbortController / AbortSignal

标准的「取消」机制：`AbortController` 是控制器，它的 `signal` 属性是一个 `AbortSignal`，调用 `controller.abort(reason)` 会把信号置为已中止并触发 `abort` 事件。支持取消的 API（`fetch`、`fs`、流、`addEventListener`）都接受 `signal` 并据此中断自身工作、释放资源。它是 promise 生态里「取消语义」的通用答案：**Promise 本身不可取消**，所以取消必须由「接收信号的一方」主动配合实现。现代用法还包括 `AbortSignal.timeout(ms)` 与 `AbortSignal.any([...])` 组合多个信号。

示例：[`18_async/13_timeout_and_abort.js`](18_async/13_timeout_and_abort.js)

### promisify（回调转 Promise）

把「err-first 回调风格」的函数包装成返回 Promise 的函数，是贯通新旧 API 的胶水。Node 提供了 `util.promisify` 做标准形态的自动转换，手写版核心不过二十行：返回 `new Promise((resolve, reject) => fn(args, (err, val) => err ? reject(err) : resolve(val)))`。需要注意两点：并非所有回调 API 形态都符合 err-first 约定（有的回调有多个返回值，需要自定义 promisify 逻辑）；`fs/promises`、`timers/promises` 等已被官方 Promise 化的模块应优先使用。也见 Error-first Callback（错误优先回调）。

示例：[`18_async/14_promisify.js`](18_async/14_promisify.js)

### Retry（失败重试）

在异步操作失败后按策略重新尝试的模式。生产级实现要回答四个问题：最多试几次、每次等待多久（常用**指数退避**，即等待时间逐次翻倍）、是否加**随机抖动**（避免大量客户端同时重试造成惊群）、以及**哪些错误值得重试**（网络超时、5xx 值得重试，参数错误 4xx 重试多少次都没用）。实现上通常是一个带 `for` 循环与 `await` 延时的小函数，配合 `AbortSignal` 支持整体取消。也见 Throttle / Rate Limiting（限流）。

示例：[`18_async/15_async_patterns.js`](18_async/15_async_patterns.js)

### Throttle / Rate Limiting（限流）

控制「单位时间内允许发起多少请求或执行多少次操作」，与并发控制（同时跑几个）互补：并发限制的是**在途数量**，限流限制的是**速率**。常见实现有令牌桶（固定速率补充令牌，突发可透支）与滑动窗口（统计最近一段时间的次数）。在客户端侧它用于保护后端、遵守第三方 API 的配额；越界时会收到 429 并需要退避。也见 Concurrency Control（并发控制）。

示例：[`18_async/15_async_patterns.js`](18_async/15_async_patterns.js)

---

## 模块化

### Module（模块）

模块是一个「自带作用域、显式声明依赖与出口」的代码单元：内部顶层变量不会泄漏成全局，外部只能通过显式导出的名字访问。它是工程化的地基——带来封装、可测试、可复用、可静态分析（tree-shaking）等能力，也是「一个文件一个职责」得以落地的前提。JavaScript 的模块化经历过 IIFE、AMD、CommonJS，最终由语言标准统一为 ESM。也见 ESM、CommonJS（CJS）。

示例：[`19_modules/08_module_scope.js`](19_modules/08_module_scope.js)

### ESM（ECMAScript Modules，ES 模块）

语言标准化的模块系统，用 `import`/`export` 声明，浏览器用 `<script type="module">`、Node 用 `.mjs` 或在 `package.json` 里声明 `"type": "module"` 启用。它的三个特性定义了它的行为：**静态结构**（依赖在解析阶段就确定，因此可以 tree-shaking 与静态检查）、**实时绑定**（导入的是导出变量的活引用，会跟随变化）、**严格模式 + 模块作用域**（自动 strict，顶层 `this` 是 `undefined`）。**常见误解**：把 ESM 当成「换了个写法的 CommonJS」——它们的加载时机与绑定语义根本不同。

示例：[`19_modules/12_esm_vs_cjs.cjs`](19_modules/12_esm_vs_cjs.cjs)

### CommonJS（CJS）

Node 早期的模块系统，用 `require()` 同步加载、用 `module.exports`/`exports` 导出，文件的求值发生在 `require` 调用的当下（运行时、动态）。它适合服务端「启动时同步读文件」的场景，但难以做静态分析，也无法在浏览器直接使用。**易踩的坑**：给 `exports` 整体重新赋值（`exports = {...}`）会切断它与 `module.exports` 的联系，导出的是空对象——要整体替换必须写 `module.exports = {...}`。也见 ESM。

示例：[`19_modules/11_cjs_require.cjs`](19_modules/11_cjs_require.cjs)

### import / export

ESM 的两个声明式关键字。`export` 只能出现在模块顶层（不能写在 `if` 或函数里），`import` 声明会被**提升**并在模块求值前完成解析与连接，所以「先使用后 import」在书写顺序上没问题。`import` 的绑定是**只读**的（对导入名赋值会报 `TypeError`），但这不代表值不能变——改变的是模块内部（见 Live Binding）。命名冲突可用 `as` 重命名，整体引入用 `import * as ns`。也见 Named Export（具名导出）、Default Export（默认导出）。

示例：[`19_modules/01_named_exports.js`](19_modules/01_named_exports.js)

### Named Export（具名导出）

`export const a = 1` / `export function f() {}` / `export { x as y }` 形式，导入时必须用**同样的名字**（或用 `as` 改名），并且必须加花括号。它的优点是名字即契约、IDE 可精确跳转与重命名、利于 tree-shaking。一个模块可以有任意多个具名导出，它们之间是并列关系。也见 Default Export（默认导出）、Re-export（重导出）。

示例：[`19_modules/01_named_exports.js`](19_modules/01_named_exports.js)

### Default Export（默认导出）

`export default 值` 为模块提供一个「主出口」，导入时可以**任意命名**且不需要花括号：`import Anything from './m.js'`。它的本质是导出了一个名为 `default` 的具名绑定，因此可以 `import { default as X } from './m.js'`，也可以在 `export { x as default }` 里动态指定。**常见误解与建议**：默认导出对重构不友好（改名不会有任何提示）、与 CJS 互操作时容易踩坑（`require` 到的可能是 `{ default: ... }`），因此很多团队约定「优先具名导出」。也见 Named Export（具名导出）。

示例：[`19_modules/02_default_export.js`](19_modules/02_default_export.js)

### Re-export（重导出）

在模块里直接把别处的导出再导出去，语法是 `export { x } from './a.js'`、`export * from './a.js'`、`export * as ns from './a.js'`。它的价值在于**收敛出口**：内部目录结构可以随意调整，对外只暴露一条稳定路径；同时它不会在当前模块里创建同名局部变量（不像 import 后再 export）。注意 `export *` **不会**转发 `default`（默认导出需要显式 `export { default } from ...`），同名冲突时后者会静默覆盖或被忽略，需要显式 `as` 消歧。

示例：[`19_modules/05_reexport.js`](19_modules/05_reexport.js)

### Namespace Import（命名空间导入）

`import * as ns from './m.js'` 把模块的所有具名导出收集成一个「命名空间对象」挂在 `ns` 上。它有两个重要特性：这是一个**密封**对象（不能添加/删除属性，尝试写入会抛错），并且它的属性是**实时绑定的访问器**（读 `ns.count` 拿到的永远是当前值，而不是导入瞬间的快照）。命名空间对象**不包含** `default`（在 ESM 里 `default` 是个普通具名导出，但作为命名空间属性访问需谨慎，不同工具处理略有差异）。它适合「一个模块导出很多东西且要按前缀区分」的场景。也见 Live Binding（实时绑定）。

示例：[`19_modules/06_namespace_import.js`](19_modules/06_namespace_import.js)

### Live Binding（实时绑定）

ESM 的导入是**指向导出变量的活引用**，而不是导入那一刻的值拷贝：导出方修改了变量，导入方下一次读取就会看到新值。这让「模块级计数器」「配置热更新」这类模式天然可行，也让模块间共享可变状态变得直观。**关键对比**：CommonJS 导出的是**值的快照**（`module.exports.fn` 被重新赋值后，已 require 的一方仍持有旧引用），这是 ESM 与 CJS 最容易踩差异的地方。注意绑定是「只读引用」——导入方不能给它赋值。

示例：[`19_modules/07_live_bindings.js`](19_modules/07_live_bindings.js)

### Module Scope（模块作用域）

每个模块都有自己的顶层作用域：顶层 `var`/`let`/`const`/函数声明都**不会**挂到全局对象上，模块之间也不会互相污染。两个显著差异：ESM 顶层 `this` 是 `undefined`（CJS 里是 `module.exports`），且 ESM 自动运行在严格模式下。另一个常被忽略的特性是**模块只求值一次**——无论被 import 多少次、从多少条路径进来，同一个文件（同一解析结果）只会执行一遍，之后的导入直接复用已求值的模块记录。也见 Module Singleton（模块级单例）。

示例：[`19_modules/08_module_scope.js`](19_modules/08_module_scope.js)

### Dynamic import()（动态导入）

`import('./m.js')` 是**函数调用式**的导入，返回 `Promise<命名空间对象>`，因此可以写在任意位置、按条件或按需加载。它解决了静态 `import` 做不到的三件事：条件加载（只在特定环境加载某模块）、懒加载（路由/弹窗打开时才拉代码）、以及与 `import.meta` 配合做运行时计算路径。**常见误解**：以为它能像 `require` 一样同步拿到模块——它总是异步的，浏览器里还会真的发起一次网络请求。也见 Top-level await（顶层 await）。

示例：[`19_modules/09_dynamic_import.js`](19_modules/09_dynamic_import.js)

### import.meta

ESM 里唯一可用的「模块元信息」对象，最常用的属性是 `import.meta.url`（当前模块的文件 URL）。基于它可以算出当前目录：`import.meta.dirname` / `import.meta.filename`（Node 20.11+ 提供）相当于 ESM 版的 `__dirname` / `__filename`——因为在 ESM 里这两个 CJS 全局变量**根本不存在**，这是从 CJS 迁移时最常见的第一个报错。浏览器里 `import.meta.url` 常用于解析 worker 或资源路径。也见 ESM、CommonJS（CJS）。

示例：[`19_modules/10_import_meta.js`](19_modules/10_import_meta.js)

### Circular Dependency（循环依赖）

两个模块互相 import：A 依赖 B，B 又依赖 A。ESM 靠「先建立绑定、后求值」的机制允许它存在，但被循环引用的那个绑定在对方求值完成前访问可能触发 `ReferenceError`（TDZ）或拿到 `undefined`；CJS 则是「拿到半成品 exports 快照」，同样会出现 `undefined` 而更隐蔽。务实结论：循环依赖本身不是语法错误，但**行为依赖求值顺序**，容易产生难查的 `undefined`，能用依赖倒置、事件、或抽公共模块消除就消除。

示例：[`19_modules/15_circular_dependencies.js`](19_modules/15_circular_dependencies.js)

### Module Resolution（模块解析）

宿主根据说明符（specifier）找到真实文件的规则：`'./x.js'` 是相对路径（ESM 里**必须**写扩展名，不像 CJS 会自动补 `.js`/`/index.js`），`'node:fs'` 是内置模块，`'lodash'` 是裸说明符（去 `node_modules` 查找），`'#internal'` 是包内私有映射（`imports` 字段）。浏览器里裸说明符需要 import map 或打包器处理。理解解析顺序能省下大量「模块找不到」的排查时间：`ERR_MODULE_NOT_FOUND` 与 `ERR_PACKAGE_PATH_NOT_EXPORTED` 分别对应「没找到文件」与「被 exports 拦住了」。也见 package.json exports 字段。

示例：[`19_modules/13_json_import.js`](19_modules/13_json_import.js)

### package.json exports 字段

定义包的**对外入口清单**，支持子路径导出（`"."`、`"./feature/alpha"`）与条件导出（按 `import`/`require`/`node`/`browser`/`default` 分别指向不同文件）。它带来的重要变化是「**封装**」：一旦声明了 `exports`，包内未列出的路径一律无法被外部解析，报 `ERR_PACKAGE_PATH_NOT_EXPORTED`，这既能防止别人依赖内部实现，也常成为升级后的破坏性变更。配合 `"type": "module"` 可以声明包内 `.js` 默认按 ESM 还是 CJS 解析。也见 ESM、CommonJS（CJS）。

示例：[`19_modules/14_package_exports.js`](19_modules/14_package_exports.js)

### Module Singleton（模块级单例）

因为同一模块在同一个进程里只求值一次并被缓存，模块顶层声明的对象天然就是「全进程唯一」的——这是 JavaScript 里最简洁的单例实现，无需 `getInstance` 之类的样板。典型用途是数据库连接池、全局配置、日志器、缓存实例。**注意边界**：单例的「唯一性」范围是「同一个模块实例」——遇到多副本打包（同一模块被打进两个 bundle）、`node_modules` 里出现两份同包不同版本、或跨 Worker/进程时，单例会被复制成多份，这是很多「状态不同步」疑难杂症的根源。

示例：[`19_modules/_counter.js`](19_modules/_counter.js)

### Barrel File（桶文件）

把目录内多个模块的导出集中再导出的「汇总文件」（通常叫 `index.js`），让外部可以 `import { a, b } from './utils'` 而不是写一长串具体路径。它提升了调用方体验与内部重构自由度，但代价是：打包器可能因副作用分析失效而带上多余代码（tree-shaking 变差）、循环依赖更容易形成、大型 barrel 还会拖慢构建与类型检查。实践中建议只在「对外公开 API」层面用 barrel，内部模块之间直接按路径引用。

示例：[`19_modules/_barrel.js`](19_modules/_barrel.js)

---

## 错误处理

### Error（错误对象）

`Error` 是 JavaScript 内建的「错误载体」，实例主要提供三个属性：`message`（人类可读描述）、`name`（错误类型名）、`stack`（调用栈，非标准但各引擎都支持）。它的作用是**携带上下文**，让错误能在向上传播的每一层被识别与处理；`throw` 任何值在语法上都可以，但抛非 Error 值会丢失堆栈，因此不推荐。构造时还可传入 `cause` 选项来链接根因。也见 Exception（异常）、Custom Error Class（自定义错误类）。

示例：[`20_error_handling/03_error_properties.js`](20_error_handling/03_error_properties.js)

### Exception（异常）

异常是「打乱了正常控制流的意外事件」这一抽象概念，而 `Error` 是它在 JavaScript 里的具体表示。两者的区别值得记住：你可以 `throw 42`（抛出的是普通值，不是 Error，异常机制照样生效但丢了堆栈）；反过来，`Error` 实例被创建出来却从未 `throw`，就只是一段普通数据。**常见误解**：把「异常」等同「崩溃」——异常只是控制流的另一种出口，被 `catch` 捕获后程序可以继续正常运行。

示例：[`20_error_handling/04_throw_statement.js`](20_error_handling/04_throw_statement.js)

### throw（抛出）

`throw expr` 立即终止当前函数的正常执行，把 `expr` 作为异常向上传播，直到某个 `try...catch` 接住它；如果一路无人捕获，就会冒泡到顶层（浏览器报错到控制台，Node 终止进程）。它和 `return` 一样是「离开函数」的方式，但走的是另一条通道，因此**可以穿透多层调用**——这正是它比返回错误码更适合表达「无法继续」的原因。注意 `throw` 是语句，换行时不要写成 `throw\n new Error()`（自动分号插入会让它变成无参抛出）。

示例：[`20_error_handling/04_throw_statement.js`](20_error_handling/04_throw_statement.js)

### try / catch

`try` 块里抛出的异常会被紧邻的 `catch (e)` 捕获，`e` 是异常值（不写参数也可以，用于只做清理的旧式写法）。**关键细节**：`catch` 只能捕获 `try` 块内**同步执行路径**上的异常——`try { setTimeout(() => { throw e }) } catch {}` 抓不到，因为那时已经离开了 `try` 块；异步代码要用 `await` 让异常回到同步路径上，或在该异步回调内部自己 `try`。另外，`catch` 里不要空着什么都不做（吞异常），至少记录或重新抛出。也见 finally、Async Error Handling（异步错误处理）。

示例：[`20_error_handling/01_try_catch_finally.js`](20_error_handling/01_try_catch_finally.js)

### finally（最终执行块）

`finally` 块**无论** `try` 里是正常结束、`return`、还是抛出异常都会执行，是释放资源（关文件、断开连接、清除定时器、复位 loading 状态）的标准位置。它比 `catch` 更可靠地「一定会跑」，因此在 `try` 里写了 `return` 也阻止不了它。**唯一的例外**是进程直接退出或 `finally` 内部的无限循环。它也常与 `catch` 搭配使用：捕获、记录、再向上抛。

示例：[`20_error_handling/01_try_catch_finally.js`](20_error_handling/01_try_catch_finally.js)

### finally 返回值覆盖陷阱

如果 `finally` 块里写了 `return`（或 `throw`），它会**覆盖** `try`/`catch` 中的 `return` 值和抛出的异常——这会让异常被静默吞掉，是最经典的一类诡异 bug。例如 `try { throw new Error('x') } finally { return 1 }` 会返回 `1` 而不抛错；`try { return 1 } finally { return 2 }` 返回 `2`。**规避原则**：`finally` 里只做清理，不要写 `return`、`break`、`continue` 或可能抛错的危险操作；清理本身失败时应当显式处理，而不是任其改写控制流。也见 finally、SuppressedError。

示例：[`20_error_handling/01_try_catch_finally.js`](20_error_handling/01_try_catch_finally.js)

### Error Propagation（错误传播）

错误向上冒泡直到被处理的过程。实践中的分层原则是「**早抛晚捕**」：底层库在发现非法状态时立刻抛出带上下文的错误（越早越好，因为此时上下文最完整），由最外层知道「该怎么办」的那一层捕获并决定重试、降级、还是提示用户；中间层如果必须处理，就用 `error.cause` 包装后继续上抛，而不是吞掉。**反模式的两种极端**是「到处 `try/catch` 然后 `console.log` 一下了事」和「任何地方都不处理」。

示例：[`20_error_handling/08_error_handling_patterns.js`](20_error_handling/08_error_handling_patterns.js)

### Error Boundary（错误边界）

「在某个边界内消化掉错误，不让它继续往上炸」的结构。它有两层含义：在前端框架里是组件级的错误边界（React 的 `componentDidCatch` / `getDerivedStateFromError`，捕获子树渲染错误并显示兜底 UI）；在通用后端/服务层则是「每个请求或任务自己兜住异常」，避免一个任务的失败拖垮整个进程。核心思想一致：**在正确的层级设置故障隔离带**，让失败局部化，并保证兜底路径本身不再抛错。也见 Fail Fast、Error Propagation（错误传播）。

示例：[`20_error_handling/08_error_handling_patterns.js`](20_error_handling/08_error_handling_patterns.js)

### Built-in Error Types（内置错误类型）

标准库预置的几种 `Error` 子类，引擎在不同场景自动抛出，用来区分「哪类问题」：`TypeError`（值的类型不符合预期，如 `undefined.foo`、调用非函数、对只读属性赋值）、`RangeError`（值超出允许范围，如 `new Array(-1)`、栈溢出、`toFixed(101)`）、`ReferenceError`（访问不存在的变量名，是 TDZ 与拼写错误的典型报错）、`SyntaxError`（语法不合法，注意它常常在**解析阶段**就抛出，`try/catch` 也救不了，`JSON.parse` 的 `SyntaxError` 则是运行时抛的）。此外还有 `URIError`、`EvalError`（几乎不再出现）以及异步聚合类错误。**实用价值**：用 `instanceof` 区分错误类型，可以只对可恢复的错误做重试或降级。

示例：[`20_error_handling/02_error_types.js`](20_error_handling/02_error_types.js)

### Custom Error Class（自定义错误类）

通过 `class MyError extends Error {}` 定义业务错误类型，从而能用 `instanceof MyError` 精确捕获、并在错误对象上携带结构化字段（如 `code`、`status`、`field`、`retryable`）。有两个必踩的坑：一是**务必在构造函数里修正 `name`**（`this.name = 'MyError'`），否则日志里显示的还是 `Error`；二是修正原型链，现代语法下 `extends Error` 已自动处理，但若编译目标是 ES5 则需要 `Object.setPrototypeOf(this, MyError.prototype)`。实践建议还包一层 `captureStackTrace` 以获得干净的堆栈。也见 Built-in Error Types（内置错误类型）。

示例：[`20_error_handling/05_custom_errors.js`](20_error_handling/05_custom_errors.js)

### error.cause（错误链）

`new Error('高层失败', { cause: lowLevelError })` 允许在抛出新错误时**保留原始错误**，通过 `err.cause` 访问，从而形成一条错误链。它解决的是「包装错误必然丢失根因」的老问题：以前要么原样抛出（缺少业务上下文），要么抛新错误（丢失底层细节），现在两者可以兼得。配套的读取方式是 `err.cause` 逐层向下遍历，或在 Node 里用 `util.inspect(err, { depth: 5 })`、`err.errors` 查看全貌。也见 Error Propagation（错误传播）、AggregateError。

示例：[`20_error_handling/06_error_cause.js`](20_error_handling/06_error_cause.js)

### AggregateError（聚合错误，ES2021）

一种把**多个错误打包成一个**的错误类型，通过 `errors` 属性访问其中的错误数组：`new AggregateError([e1, e2], '批量失败')`。最典型的抛出者是 `Promise.any`——当所有候选 Promise 都失败时，它抛出的正是 `AggregateError`，`errors` 里按顺序装着每一份拒绝理由。它适合「一次操作里多个子项同时失败」的场景：表单多项校验、批量导入部分行非法、并发任务汇总。**常见误解**：以为它能替代 `cause`——`cause` 是单向链（A 由 B 引起），`AggregateError` 是并列表（A 同时包含 B 和 C）。

示例：[`20_error_handling/07_aggregate_error.js`](20_error_handling/07_aggregate_error.js)

### SuppressedError（被压制错误，ES2025）

当「处理错误的清理过程中又抛出了新错误」时，用来同时保存**原错误**与**压制它的新错误**的类型，属性为 `error`（新错误）与 `suppressed`（被压制的原错误）。它是配合显式资源管理（`using` / `await using`）引入的：释放资源的 `Symbol.dispose` 若在异常展开期间抛错，引擎就会用 `SuppressedError` 把两者一起抛出来，避免原错误被静默吞掉。它补上了「清理代码覆盖原始异常」这一长期存在的语义漏洞（对照 `finally` 里 `return`/`throw` 的覆盖陷阱）。也见 finally 返回值覆盖陷阱、AggregateError。

示例：[`20_error_handling/07_aggregate_error.js`](20_error_handling/07_aggregate_error.js)

### Error-first Callback（错误优先回调）

Node 的核心回调约定：回调的第一个参数**保留给错误**（成功时为 `null` 或 `undefined`），第二个参数才是结果，即 `(err, data) => {}`。它的价值是让「失败」与「成功」共用一条代码路径，调用方必须先判断 `err`，从而强迫处理错误；同时这个统一形态让自动 promisify 成为可能。**关键细节**：约定要求回调**恰好被调用一次**、且失败时第一个参数必须是 Error 实例（而不是字符串或错误码）。也见 promisify（回调转 Promise）、Callback Function（回调函数）。

示例：[`18_async/14_promisify.js`](18_async/14_promisify.js)

### Defensive Programming（防御式编程）

在代码边界处主动校验输入、不信任外部数据（用户输入、接口响应、文件内容、URL 参数），以便在问题扩散前就把它挡住。手段包括参数校验、类型守卫（`typeof`/`Array.isArray`/`instanceof`）、默认值、可选链与空值合并、以及把「不该发生的状态」变成显式的抛错。它与 Fail Fast 是同一思路的两面：**边界处宽容（给出清晰提示），内部严格（断言不变量）**。需要避免的过度防御是到处 `if (x != null)` 把真正的 bug 掩盖成静默的 `undefined`。也见 Fail Fast、Assertion（断言）。

示例：[`20_error_handling/12_defensive_programming.js`](20_error_handling/12_defensive_programming.js)

### Fail Fast（快速失败）

一旦检测到无法继续的错误状态就**立刻抛出**，而不是带着错误状态勉强往下跑。它的收益是：错误发生点与暴露点接近，堆栈与上下文完整，排查成本最低；否则错误会以「奇怪的 `undefined`」「错误的计算结果」等形式在很远的地方浮现，定位起来极其痛苦。实现要点是优先用 `throw` 而不是返回错误码/`null`，并且不要写「捕获后继续当没事发生」的 `catch`。也见 Assertion（断言）、Defensive Programming（防御式编程）。

示例：[`20_error_handling/12_defensive_programming.js`](20_error_handling/12_defensive_programming.js)

### Assertion（断言）

用「如果条件不成立就说明程序有 bug」的语气写检查，代表 API 是 `assert(条件, 消息)`，或 Node 的断言模块提供的 `assert.strictEqual`、`assert.deepStrictEqual`、`assert.throws` 等。它与普通错误处理的区别在**语义定位**：断言针对「内部不变量被破坏（程序员错误）」，不该用于校验用户输入这类「预期内的失败」；断言失败表示代码写错了，而不是环境出了问题。在测试中被大量用于验证行为，在生产代码中通常只在开发期启用（生产可被裁剪）。也见 Fail Fast、Defensive Programming（防御式编程）。

示例：[`20_error_handling/11_assertion.js`](20_error_handling/11_assertion.js)

### Node Error Code（错误码 err.code）

Node 的 I/O 与系统调用错误会在 Error 实例上附加 `code` 属性（如 `ENOENT` 文件不存在、`EACCES` 权限不足、`EEXIST` 已存在、`EISDIR` 期望文件却是目录、`ECONNREFUSED` 连接被拒），用于**在不依赖错误文案的前提下**做程序化判断。**关键细节**：不要去匹配 `err.message` 字符串——文案会随版本和语言环境变化，`err.code` 才是稳定契约。此外还有 `errno`、`syscall`、`path` 等辅助字段可以提供更具体的上下文。也见 Custom Error Class（自定义错误类）。

示例：[`20_error_handling/10_node_error_codes.js`](20_error_handling/10_node_error_codes.js)

---

## JSON

### JSON（JavaScript Object Notation，JS 对象表示法）

一种**语言无关的文本数据交换格式**，源自 JavaScript 的对象字面量语法但只保留了一个更严格的子集。它只有六种值类型：对象、数组、字符串、数字、布尔、`null`，因此能表达的东西非常有限却因此极为通用。**与 JS 对象字面量的关键差异**：键必须用双引号、不能有尾逗号、不能有注释、不能出现 `undefined`/函数/`NaN`/`Infinity`、字符串只能用双引号。这些差异正是 `JSON.parse` 报 `SyntaxError` 的常见原因。也见 JSON.parse、JSON.stringify。

示例：[`21_json/02_json_format_rules.js`](21_json/02_json_format_rules.js)

### Serialization / Deserialization（序列化与反序列化）

序列化是「把内存中的数据结构转成可存储/可传输的字节流或文本」的过程，反序列化是其逆过程。JSON 是最常见的载体，但不是唯一——二进制协议、`structuredClone`、`v8.serialize`、Protocol Buffers 都各有所长，选择取决于「是否需要保真类型」。**核心代价**：序列化是**有损**的，类型信息会丢失，所以「反序列化回来和原来一模一样」通常不成立（这也是 `JSON` 深拷贝有坑的根源）。也见 JSON.parse、JSON.stringify、序列化陷阱。

示例：[`21_json/01_parse_and_stringify.js`](21_json/01_parse_and_stringify.js)

### JSON.parse（解析）

把 JSON 文本解析成 JavaScript 值，语法是 `JSON.parse(text, reviver?)`。**关键特性与坑**：它要求输入是**完整且合法**的 JSON，多一个尾逗号都会抛 `SyntaxError`，而且这个错误发生在运行时（可以用 `try/catch` 接住）；解析结果里的数字一律是双精度 `Number`，因此超过 2^53 的大整数会**静默丢精度**；`__proto__` 键在新标准下被安全处理，历史上曾是原型污染漏洞的来源（对象字面量赋值式解析）。解析大型文本时还要注意它会一次性占用内存。也见 reviver、大整数精度。

示例：[`21_json/01_parse_and_stringify.js`](21_json/01_parse_and_stringify.js)

### JSON.stringify（序列化）

把 JavaScript 值转成 JSON 文本，完整签名是 `JSON.stringify(value, replacer?, space?)`。第三个参数 `space` 控制缩进（数字表示空格数，字符串表示缩进字符），用于生成可读的格式化输出。**关键行为**：它按「对象自有可枚举属性」遍历，并且会先调用值上的 `toJSON()`；遇到 `undefined`、函数、Symbol 作为**属性值**时直接跳过该键，作为**数组元素**时替换为 `null`。另一个必须记住的点是：它会**抛 `TypeError`** —— 遇到 `BigInt` 或循环引用时。也见 replacer、toJSON、循环引用。

示例：[`21_json/01_parse_and_stringify.js`](21_json/01_parse_and_stringify.js)

### replacer（替换器）

`JSON.stringify` 的第二个参数，用来在序列化时过滤或改写数据：传**数组**时相当于白名单（只保留列出的键），传**函数**时每个键值对都会调用一次 `replacer(key, value)`，其返回值取代原值，返回 `undefined` 则该键被删除。**关键细节**：函数形式会被**自下而上**调用（先子后父），第一次调用的 `key` 是空字符串 `''`、`value` 是顶层值，且 `replacer` 里的 `this` 指向当前所在的对象（因此可以用箭头函数外的普通函数访问同级属性）。也见 reviver、toJSON。

示例：[`21_json/03_replacer_and_reviver.js`](21_json/03_replacer_and_reviver.js)

### reviver（还原器）

`JSON.parse` 的第二个参数，一个 `(key, value) => newValue` 的函数，在解析过程中被**自下而上**（先子后父）调用，可用于类型恢复（把 ISO 字符串还原成 `Date`、把特殊标记还原成 `Map`）或数据清洗。返回 `undefined` 会**删除**该属性。**常见误解**：以为在 `reviver` 里能拿到原始文本——普通 `value` 已经是解析后的值了，想要原文必须用第三参数 `context.source`。也见 replacer、reviver 的 context.source。

示例：[`21_json/03_replacer_and_reviver.js`](21_json/03_replacer_and_reviver.js)

### toJSON（自定义序列化出口）

如果被序列化的值上存在 `toJSON()` 方法，`JSON.stringify` 会先调用它，并用它的返回值替代该值参与后续序列化。它是「对象自己决定我该如何被序列化」的标准钩子：`Date.prototype.toJSON` 正是这样把日期输出成 ISO 8601 字符串的。你可以给自己的类定义 `toJSON()` 来隐藏内部字段、转换单位、或把不可序列化的部分换成可序列化形式。**注意**：`toJSON` 接收一个 `key` 参数（该值所在的键名），并且在**任何**层级的序列化中都会被调用，包括嵌套深处。也见 JSON.stringify、序列化陷阱。

示例：[`21_json/06_tojson_method.js`](21_json/06_tojson_method.js)

### 序列化陷阱（JSON 有损性）

`JSON.stringify` 会静默丢弃或改写一批值，这是「JSON 深拷贝」和「网络传输」中最常见的 bug 来源：`undefined`、函数、Symbol 作为属性值时**整个键被丢弃**（数组里则变成 `null`）；`NaN` 与 `Infinity` 变成 `null`；`Date` 变成 ISO 字符串（不再是 Date 实例）；`RegExp`、`Map`、`Set` 变成 `{}`；`BigInt` 直接抛 `TypeError`；`-0` 变 `0`；类实例的**原型与 getter 语义全部丢失**，只留下自有可枚举属性。要保真传输就得自定义 `toJSON` + `reviver`，或者换用 `structuredClone`（支持 Date/Map/Set/循环引用，但仍不支持函数与类原型）。也见 JSON 深拷贝、循环引用。

示例：[`21_json/04_serialization_edge_cases.js`](21_json/04_serialization_edge_cases.js)

### Circular Reference（循环引用）

对象图里出现 `a.self = a` 或 `a.b = b; b.a = a` 这样的自引用时，`JSON.stringify` 无法用有限文本表达，会直接抛 `TypeError: Converting circular structure to JSON`。因为 JSON 是**树**结构，而内存里的对象是**图**结构，两者表达能力不对称。解决办法有：用 `replacer` 检测并跳过/替换已访问对象、用 `structuredClone`（原生支持循环引用）、用 WeakSet 手动实现深拷贝、或改用支持引用的序列化方案。也见 序列化陷阱。

示例：[`21_json/04_serialization_edge_cases.js`](21_json/04_serialization_edge_cases.js)

### JSON Lines / NDJSON（逐行 JSON）

一种「每行一个独立 JSON 文档、行与行之间用换行分隔」的文本格式（文件扩展名常为 `.jsonl`/`.ndjson`）。它不是 JSON 标准的一部分，却非常适合日志与大数据：可以**流式处理**（读一行解析一行，内存占用恒定，不受文件大小影响）、可以在文件末尾**追加**（而整个数组式的 JSON 必须整体重写）、单行损坏也只影响一行。**注意点**：不能有跨行的美化缩进（每个对象必须压成一行），解析时要处理空行与末尾换行符。也见 JSON.parse、Serialization / Deserialization（序列化与反序列化）。

示例：[`21_json/08_json_lines.js`](21_json/08_json_lines.js)

### JSON.rawJSON（ES2025）

一个静态方法，把一段**未被转义的 JSON 原文**包装成特殊对象，交给 `JSON.stringify` 时**原样嵌入**结果——既不解析成 Number 也不加引号。它主要用于**大整数精度的序列化侧**：`JSON.stringify({ id: JSON.rawJSON('1234567890123456789') })` 能得到 `{"id":1234567890123456789}`，一个字符都不丢；而若用普通数字字面量，JS 的 `Number` 早就把它变成 `1234567890123456800` 了。配套的 `JSON.isRawJSON(value)` 用来判断某个值是否是这种包装。**限制**：传入的字符串必须本身就是合法 JSON 片段，否则 `JSON.rawJSON` 会抛 `SyntaxError`。也见 大整数精度。

示例：[`21_json/09_raw_json_and_big_numbers.js`](21_json/09_raw_json_and_big_numbers.js)

### 大整数精度（BigInt 与 JSON）

JS 的 `Number` 是 IEEE 754 双精度浮点，只能精确表示到 2^53 - 1（`Number.MAX_SAFE_INTEGER = 9007199254740991`），超出后相邻整数会「合并」成同一个值。而 JSON 本身对整数长度**没有限制**，于是「后端用字符串或大数传的雪花 ID / 订单号」在 `JSON.parse` 之后经常被悄悄改掉尾数，且毫无报错。三种对策：用 `JSON.rawJSON` 在序列化侧原样输出、用 `reviver` 的第三参数 `context.source` 在解析侧拿回原文再决定转成 `BigInt` 还是字符串（`JSON.parse` 的 `context.source`，Node 22+）、或干脆约定这类字段以字符串形式传输。也见 JSON.rawJSON、reviver 的 context.source。

示例：[`21_json/09_raw_json_and_big_numbers.js`](21_json/09_raw_json_and_big_numbers.js)

### reviver 的 context.source（原文还原）

ES2025 给 `JSON.parse` 的 `reviver` 增加了第三个参数 `context`，其唯一的 `source` 属性保存了**该节点在原始文本里的那段原文**。于是 `JSON.parse('{"n": 1.50}', (k, v, ctx) => ctx.source)` 里 `v` 是数字 `1.5`，而 `ctx.source` 是字符串 `"1.50"` —— 精度与写法被完整保留。它是「大整数精度」问题在**解析侧**的答案：拿到原文后再决定转 `BigInt`、转字符串，或保留原样。**注意**：`context.source` 只在该 reviver 被调用的节点上有效，且只在支持该特性的运行时（Node 22+ / 新版浏览器）可用。也见 大整数精度、reviver。

示例：[`21_json/10_parse_source_context.js`](21_json/10_parse_source_context.js)

### Lone Surrogate（孤立代理项）

UTF-16 用「代理对」表示 BMP 之外的字符（如 emoji），单个代理项本身不是合法字符。JSON 文本里允许出现 `\uD800` 这类**孤立代理项**，解析后 JS 字符串里就会留下它们；而某些序列化目标（如 `encodeURIComponent`、UTF-8 编码、写入文本文件）遇到孤立代理项会抛错或产生乱码。ES2019 起 `JSON.stringify` 会把孤立代理项输出为转义形式 `\uD800`（`well-formed JSON.stringify`），保证了结果可以被安全编码，但反序列化回来仍是「半截」的字符。实践建议是在入口处清洗或用 `String.prototype.toWellFormed()` 修正。也见 JSON.stringify、序列化陷阱。

示例：[`21_json/11_lone_surrogates.js`](21_json/11_lone_surrogates.js)

### JSON 深拷贝（Deep Clone with JSON）

`JSON.parse(JSON.stringify(obj))` 是流传最广的深拷贝写法，一行搞定且能切断引用关系。但它是一把**有明确射程**的工具：由于前面提到的序列化陷阱，它会丢失 `undefined`/函数/Symbol、把 `Date` 变字符串、把 `NaN` 变 `null`、让 `Map`/`Set`/RegExp 变空对象、遇到 `BigInt` 或循环引用直接抛错，还会丢掉原型与 getter。**适用场景**：结构简单、只含 JSON 合法类型的纯数据（配置、DTO）。需要保真时改用 `structuredClone`（支持 Date/Map/Set/循环引用/ArrayBuffer）或专门的深拷贝实现。也见 序列化陷阱、Circular Reference（循环引用）。

示例：[`21_json/05_deep_clone_with_json.js`](21_json/05_deep_clone_with_json.js)
