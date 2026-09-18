## 测试

### Testing Pyramid（测试金字塔）

测试金字塔是「不同粒度的自动化测试各写多少」的经验分布模型：底层是数量最多、跑得最快的**单元测试**，中间是数量适中的**集成测试**，塔尖是数量最少、最慢也最脆弱的**端到端测试**。之所以是金字塔而不是倒三角，是因为越往上层跑一次的成本越高、失败原因越难定位、越容易因环境波动而随机失败；把验证重心压在单元层，才能既快又准地拿到反馈。关键细节：它描述的是**投入比例**而非「上层不重要」——用户真正感知到的价值恰恰在 E2E 层，所以实践中常配合「测试奖杯」（单元与集成占多数，E2E 少而精）使用；比例也不是教条，纯函数库可以几乎只有单元测试，而支付这类关键链路值得多写集成测试。

**常见误解**：把「单元测试数量必须多于 E2E」当成硬规定，或者把集成测试看作「跑得慢的单元测试」而整层省略。

也见 [Unit Test（单元测试）](#unit-test单元测试)、[Integration Test（集成测试）](#integration-test集成测试)、[End-to-End Test / E2E（端到端测试）](#end-to-end-test-e2e端到端测试)。

示例：[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### Unit Test（单元测试）

单元测试针对**一个最小的可验证单元**（通常是一个函数或一个类）做隔离验证，只关心「给定输入得到什么输出／抛什么错」，不启动服务器、不连数据库、不碰网络。它的价值在于**快**（毫秒级、可随文件保存实时跑）和**定位准**（红了就知道是哪个函数坏了）。关键细节：可测性最好的单元是**纯函数**——相同输入永远得到相同输出、不产生副作用，因此不需要任何测试替身即可断言；一旦函数内部直接 `fetch` 或读全局状态，就必须靠注入或 mock 才能测。写单元测试的重点不是覆盖率数字，而是覆盖**边界值**（0、空字符串、`null`、极大值）与**等价类**，因为 bug 几乎都藏在边界上。

**常见误解**：以为「调用了一个函数」就算单元测试——如果它顺带真的发出了网络请求，那已经是集成测试了。

也见 [Integration Test（集成测试）](#integration-test集成测试)、[Test Double（测试替身）](#test-double测试替身)、[Parameterized Test（参数化测试）](#parameterized-test参数化测试)。

示例：[`28_testing/07_testing_pure_functions.js`](28_testing/07_testing_pure_functions.js)

### Integration Test（集成测试）

集成测试验证**多个模块拼在一起**能否正常协作：路由 + 校验 + 业务逻辑 + 数据层、或者客户端代码与真实 HTTP 服务之间的契约。它牺牲了一部分速度和定位精度，换来的正是单元测试看不见的东西——**接线错误**（参数顺序错、字段名对不上、序列化格式不一致）。关键细节：集成测试的「集成」程度可以分级，最实用的一档是「用真实端口起一个服务，用真实请求打进去」，既避开了 mock 带来的「假通过」，又不用引入数据库等重资产；断言要落在**对外契约**（状态码、响应体结构、错误格式）上，而不是内部实现细节，否则重构时测试会成批碎掉。

**常见误解**：以为集成测试一定要连真实数据库或第三方服务——它只要求「多于一个单元」，起一个内存存储的真实 HTTP 服务就已经是合格的集成测试。

也见 [End-to-End Test / E2E（端到端测试）](#end-to-end-test-e2e端到端测试)、[Mock（模拟对象）](#mock模拟对象)。

示例：[`28_testing/14_testing_http.js`](28_testing/14_testing_http.js)、[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### End-to-End Test / E2E（端到端测试）

端到端测试从**用户视角**驱动整个系统：打开浏览器、点击、输入、等待，然后断言屏幕上出现了什么。它是最接近真实使用、最能给人信心的测试，也因此是最慢（分钟级）、最脆弱（网络抖动、动画时序、第三方依赖都会让它随机失败）、最难定位（红了只说明「某一环坏了」）的一层。关键细节：E2E 应该只覆盖**关键业务流程**（登录、下单、支付这类「坏了就是事故」的路径），并且要刻意避开对像素和绝对时序的断言——等待元素出现而不是等待固定毫秒数，是让 E2E 稳定的第一原则。

**常见误解**：以为 E2E 越多越安全。实际上大量脆弱的 E2E 会拖慢流水线、消耗团队对红灯的信任，最终被集体忽略，反而比没有测试更糟。

也见 [Testing Pyramid（测试金字塔）](#testing-pyramid测试金字塔)、[Flaky Test（不稳定测试）](#flaky-test不稳定测试)。

示例：[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### Smoke Test（冒烟测试）

冒烟测试是一组**极短、只回答「系统还能不能启动」**的检查：进程能否起来、首页能否返回 200、关键依赖能否连上。名字来源于硬件通电看是否冒烟。它不验证业务正确性，只做「部署后第一道闸门」，目的是在几十秒内把「这次发布整个是坏的」挡下来，而不是等 E2E 跑完十分钟才发现。关键细节：冒烟测试通常跑在**构建产物**上而不只是源码（源码能跑不代表打包后能跑），并且在流水线里位于「部署到预发之后、放全量流量之前」这个位置。

**常见误解**：把冒烟测试和「快速回归测试」混为一谈——前者的判据是「活没活」，后者的判据是「对不对」。

也见 [Regression Test（回归测试）](#regression-test回归测试)、[Testing Pyramid（测试金字塔）](#testing-pyramid测试金字塔)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Test Case（测试用例）

测试用例是**一条独立的、有明确预期的验证单元**：给定前置条件、执行某个操作、断言某个结果。一条好的用例只验证一件事，名字要能当文档读（`空数组时返回 0 而不是抛错`），失败信息要足以让人不看代码就知道哪里不对。关键细节：用例之间必须彼此独立——「用例 A 先跑，用例 B 才能过」是测试套件里最隐蔽的债务，因为一旦并行执行或单独重跑就会神秘失败。

**常见误解**：以为 `test('测试一下登录')` 里塞进十个断言是「省事」。一旦第一个断言失败，后面的信息全部丢失，定位成本反而更高。

也见 [Test Suite（测试套件）](#test-suite测试套件)、[Test Isolation（测试隔离）](#test-isolation测试隔离)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Test Suite（测试套件）

测试套件是**一组被组织在一起、一起运行的测试用例**，通常对应一个文件、一个模块或一个 `describe` 分组。套件不仅是收纳盒，它还携带共享的前置与清理逻辑（`beforeEach`/`afterAll`），并且是「单独跑一个文件」的最小单位——排查问题时先缩小到某个套件，再缩小到某条用例。关键细节：套件的划分应当与**被测代码的边界**一致（一个模块一个套件），这样「哪个套件红了」本身就是一条定位信息。

**常见误解**：把「套件」等同于「测试运行器」——套件是内容的组织单位，运行器是执行它的工具。

也见 [Test Case（测试用例）](#test-case测试用例)、[Test Runner（测试运行器）](#test-runner测试运行器)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Assertion（断言）

断言是测试里**把「实际值」和「期望值」对比的那一句**：不成立就抛错，让用例失败。`node:assert` 提供了一组语义精确的方法：`strictEqual`（`Object.is` 语义，不做类型转换）、`deepStrictEqual`（递归比较结构与原型）、`throws`/`rejects`（断言会抛错或拒绝）、`ok`（真值判断）、`match`（正则匹配）。关键细节：**选错断言方法会造成假通过**——用 `==` 语义的相等断言比较 `'1'` 与 `1` 会通过，用 `deepEqual` 而不是 `deepStrictEqual` 可能放过类型错误；`.rejects` 必须 `await`（或 `return`），否则断言还没执行测试就已经算通过了。

**常见误解**：以为断言越多越好。断言应聚焦于可观察行为，把「实现细节」写进断言会让重构变成改测试。

也见 [Test Case（测试用例）](#test-case测试用例)、[Vitest（Vitest 与 Jest）](#vitestvitest-与-jest)。

示例：[`28_testing/03_assert_module.js`](28_testing/03_assert_module.js)

### Test Runner（测试运行器）

测试运行器是**负责发现、执行、汇总测试并决定进程退出码**的工具：它扫描测试文件、按结构逐个执行用例、捕获失败与超时、打印报告，最后以非零退出码告诉你「有没有挂」——这个退出码正是流水线判断成败的依据。关键细节：运行器通常还提供筛选（只跑名字匹配的用例）、并发、watch 模式、覆盖率集成与生命周期钩子；JS 生态里常见的运行器有 Node 内置的 `node:test`、Vitest、Jest、Mocha（需搭配断言库）等。

**常见误解**：把「断言库」和「运行器」混为一谈——`node:assert` 只会抛错，是运行器把它捕获并汇报成「一条失败的用例」。

也见 [node:test（Node 内置测试运行器）](#nodetestnode-内置测试运行器)、[Vitest（Vitest 与 Jest）](#vitestvitest-与-jest)、[Assertion（断言）](#assertion断言)。

示例：[`28_testing/02_node_test_runner.js`](28_testing/02_node_test_runner.js)

### node:test（Node 内置测试运行器）

`node:test` 是 Node.js 自带的测试运行器模块，**零依赖**即可写测试：`import { test } from 'node:test'`，用 `test()` 定义用例、`t.test()` 定义子测试、`describe`/`it` 分组，跑 `node --test` 自动发现文件。关键细节：它与 `node:assert` 天然配套，支持 `mock` 子模块、`--experimental-test-coverage` 覆盖率、并发与超时；优点是**不必为一个 hello world 装 200MB 的 node_modules**，缺点是生态（快照、浏览器环境、DOM 断言）不如 Vitest/Jest 丰富。本仓库之所以能在只有少量依赖的前提下演示测试，正是因为它。

**常见误解**：以为「内置 = 玩具」。`node:test` 的 API 已足以支撑生产项目，只是缺少前端组件测试这类专用能力。

也见 [Test Runner（测试运行器）](#test-runner测试运行器)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/02_node_test_runner.js`](28_testing/02_node_test_runner.js)

### Vitest（Vitest 与 Jest）

Vitest 与 Jest 是功能完备的**测试框架**（运行器 + 断言 + 替身 + 覆盖率一体）：共享 `describe`/`it`/`expect`/`beforeEach` 这套描述风格，提供 `vi.fn()`/`jest.fn()` 造替身、`vi.mock()` 做模块级 mock、`toMatchSnapshot()` 做快照、`--coverage` 出覆盖率报告。关键差异：Jest 历史悠久、生态与文档最厚，自带 jsdom 环境；Vitest 复用 Vite 的转换与依赖图，启动与 watch 更快、原生 ESM/TS 无痛，API 基本兼容 Jest。关键细节：本仓库只把 Vitest 作为 devDependency 用于**演示其 API 风格**，实际示例统一跑在 `node:test` 上，这样 `npm run check` 不需要额外的测试框架即可执行。

**常见误解**：以为「装了 Jest 就能测一切」——它们默认跑在 Node 环境，测 DOM 需要额外配置 `jsdom`/`environment`。

也见 [Assertion（断言）](#assertion断言)、[Snapshot Testing（快照测试）](#snapshot-testing快照测试)、[node:test（Node 内置测试运行器）](#nodetestnode-内置测试运行器)。

示例：[`28_testing/10_vitest_intro.js`](28_testing/10_vitest_intro.js)

### Test Isolation（测试隔离）

测试隔离要求**每条用例都在干净、可预测的状态下开始**，不依赖其它用例留下的数据、全局变量、模块缓存或执行顺序。它之所以重要，是因为「顺序依赖」的测试套件一旦并行化、被随机排序或单独重跑就会莫名其妙地红，而这类失败的排查成本极高。关键细节：隔离需要主动清理——每个用例的 `beforeEach` 重建状态、用例结束后还原被替换的替身与被修改的全局对象（`t.after`/`afterEach` 是常见位置）；模块级的可变状态（单例、缓存）是最容易泄漏的一类。

**常见误解**：以为「我只改了一个局部变量所以不用清理」——模块单例、`Date.now`、`Math.random`、环境变量都是跨用例的共享状态，必须显式恢复。

也见 [Setup / Teardown（测试前置与后置）](#setup-teardown测试前置与后置)、[Flaky Test（不稳定测试）](#flaky-test不稳定测试)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Setup / Teardown（测试前置与后置）

Setup 与 teardown 是运行器提供的**生命周期钩子**：`before`/`beforeEach` 在测试（或每个测试）之前准备环境，`after`/`afterEach` 之后清理现场，作用域由它们所在的分组（套件或文件）决定。核心原则是「**谁申请，谁释放**」：在 `before` 里起的服务、开的文件、建的连接，必须在 `after` 里关掉，否则进程可能挂住不退出。关键细节：`beforeEach` 提供的是「每条用例都全新的状态」，天然满足隔离要求，但代价是重复开销——因此「只读的昂贵准备」放 `before`，「会被修改的状态」放 `beforeEach`。

**常见误解**：以为 `after` 只在成功时执行。用 `try/finally` 或运行器的钩子语义可以保证失败路径也清理，否则一次失败会污染后续用例。

也见 [Test Isolation（测试隔离）](#test-isolation测试隔离)、[Fixture（夹具）](#fixture夹具)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Fixture（夹具）

夹具是**测试所依赖的固定数据或固定环境**：一组预置的用户记录、一个临时目录、一份已知内容的配置文件。夹具的作用是让「输入」成为常量，从而让「输出」可被断言；它可以是内联的字面量、抽出的工厂函数（`makeUser({ role: 'admin' })`），或从外部加载的数据文件。关键细节：夹具应当**偏向工厂函数而不是共享常量对象**——共享对象会被某个用例意外修改，造成跨用例污染；工厂每次返回新实例，天然隔离。

**常见误解**：以为夹具越「真实」（比如导出生产数据库的一份快照）越好。过大、过真的夹具会让测试难以理解也难维护，且一旦数据结构变化就要全量返工。

也见 [Setup / Teardown（测试前置与后置）](#setup-teardown测试前置与后置)、[Test Isolation（测试隔离）](#test-isolation测试隔离)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Parameterized Test（参数化测试）

参数化测试用**一张「输入 → 期望输出」的表**驱动同一条断言逻辑，为每一行生成一个独立用例。它把「三条几乎一样的测试」压缩成一份数据，新增用例只是加一行，而且失败信息会指明是哪一组数据挂了。关键细节：表里要显式包含**边界值**（0、空字符串、`null`、`NaN`、极大值）和**非法输入**（应当抛错的情况，可用 `throws` 单独处理）；数据驱动测试的可读性依赖命名，用对象数组 `{ input, expected, desc }` 比纯二维数组更清楚。

**常见误解**：以为参数化只是「少打字」。它真正的收益是把「容易漏掉的边界情况」变成一份可审查的清单——漏了哪个边界，一眼就能从表里看出来。

也见 [Unit Test（单元测试）](#unit-test单元测试)、[Test Case（测试用例）](#test-case测试用例)。

示例：[`28_testing/07_testing_pure_functions.js`](28_testing/07_testing_pure_functions.js)

### Test Coverage（测试覆盖率）

覆盖率衡量**测试执行到了多少代码**，通常分四个口径：**语句覆盖**（多少条语句被执行）、**分支覆盖**（每个 `if`/`switch`/`?:`/`&&` 的两个方向是否都走到）、**函数覆盖**（多少函数被调用过）、**行覆盖**（源码多少行被执行）。它由运行器在代码里插桩统计得出，可以直观指出「哪些代码从来没被测过」。关键细节：覆盖率是**下限指标而非目标**——100% 覆盖不代表正确（断言可能很弱、可能只是把所有分支跑了一遍却没检查结果），而覆盖率低几乎是确定的信号；分支覆盖比语句覆盖更能暴露「只测了 happy path」。

**常见误解**：把覆盖率当 KPI 追求数字。一旦如此，团队会写出「执行代码但不做有效断言」的测试来刷指标，指标涨了而质量没涨。

也见 [Branch Coverage（分支覆盖率）](#branch-coverage分支覆盖率)、[Assertion（断言）](#assertion断言)。

示例：[`28_testing/08_test_coverage_concept.js`](28_testing/08_test_coverage_concept.js)

### Branch Coverage（分支覆盖率）

分支覆盖率专门回答「**控制流的每个出口都走过了吗**」：`if/else` 的两条路、`switch` 的每个 `case` 加 `default`、`a && b` 的短路两侧、`try/catch` 的 `catch`、可选链后 `??` 的两侧。它比语句覆盖更严格，因为一个 `if` 只有一行语句，走真分支就算语句覆盖 100%，但假分支可能从未执行。关键细节：未覆盖的分支往往对应**错误处理与兜底路径**——这些路径恰恰是线上最容易出事的，因为平时没人走；所以「分支覆盖率低」通常意味着「异常路径没测」。

**常见误解**：以为短路表达式不算分支。当 `a` 为假时右侧根本不会执行，这一侧同样是需要覆盖的分支。

也见 [Test Coverage（测试覆盖率）](#test-coverage测试覆盖率)、[Unit Test（单元测试）](#unit-test单元测试)。

示例：[`28_testing/08_test_coverage_concept.js`](28_testing/08_test_coverage_concept.js)

### TDD（测试驱动开发，Test-Driven Development）

TDD 是一种**先写测试、再写实现**的开发节奏：在写下任何产品代码之前，先写一条会失败的测试，用它把「我要的行为」表达成可执行的形式，再写刚好让它通过的实现，最后在测试的保护下重构。它的价值不在「测试」，而在**设计**——因为必须让测试能独立调用被测代码，你被迫写出低耦合、依赖可注入的结构；同时你永远有一份「已完成」的清单，不会写着写着跑偏。关键细节：TDD 的步子必须小（一次只加一条测试），否则会退化成「先写完实现再补测试」；对于接口未定、探索性强的代码，TDD 反而不是最合适的起点。

**常见误解**：以为 TDD 能保证代码正确。它保证的是「你写下的预期都被满足」，如果预期本身错了，测试全绿也照样是错的。

也见 [Red-Green-Refactor（红-绿-重构）](#red-green-refactor红-绿-重构)、[Unit Test（单元测试）](#unit-test单元测试)、[Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)。

示例：[`28_testing/09_tdd_workflow.js`](28_testing/09_tdd_workflow.js)

### Red-Green-Refactor（红-绿-重构）

这是 TDD 的三拍循环：**红**——写一条失败的测试，确认它确实因为「功能没实现」而失败（如果它一写就绿，说明这条测试没在验证任何东西）；**绿**——用最简单甚至有点笨的写法让测试通过，此阶段唯一目标是从红变绿，不追求优雅；**重构**——测试全绿的前提下清理实现，改结构不改行为，测试是你的安全网。关键细节：三步都不可省，尤其「先确认红」常被跳过，导致测试写错方向（比如断言写反、根本没调用到被测代码）却一路绿灯；重构阶段必须保持测试绿，一旦变红立刻回退。

**常见误解**：以为「绿」阶段的代码可以直接进主干。绿只是阶段性成果，跳过重构会迅速积累出「测试齐全但代码一团糟」的代码库。

也见 [TDD（测试驱动开发）](#tdd测试驱动开发test-driven-development)、[Regression Test（回归测试）](#regression-test回归测试)。

示例：[`28_testing/09_tdd_workflow.js`](28_testing/09_tdd_workflow.js)

### Snapshot Testing（快照测试）

快照测试首次运行时把实际输出**序列化存成一份基准文件**（快照），之后每次运行都与它比对：一致则通过，不一致则失败并展示差异，由你决定是「代码改错了」还是「输出确实变了，更新快照」。它最适合输出结构复杂、逐字段断言不现实的场景，比如序列化后的配置对象、渲染出的 HTML 结构。关键细节：快照必须**随代码一起提交并进入代码评审**——否则「随手更新快照」会变成掩盖回归的常规操作，让快照测试彻底失效；同时要避免在快照里包含时间戳、随机数、绝对路径这些每次都不同的内容。

**常见误解**：以为快照能替代有意设计的断言。快照只回答「和上次一样吗」，回答不了「对不对」；把它用在核心业务逻辑上，等于把测试的判据交给了上一次运行的自己。

也见 [Regression Test（回归测试）](#regression-test回归测试)、[Vitest（Vitest 与 Jest）](#vitestvitest-与-jest)。

示例：[`28_testing/11_snapshot_testing.js`](28_testing/11_snapshot_testing.js)

### Regression Test（回归测试）

回归测试用来回答「**这次改动有没有把原本好用的功能弄坏**」。「回归（regression）」指曾经正常的行为退回到了错误状态。它未必是一类特殊的测试写法，更多是一种**用途定位**：任何在修 bug 之后补写、用来锁住该 bug 的测试都是回归测试（先复现、再修复、再留下测试），任何在每次提交都重跑的既有测试套件也在承担回归职责。关键细节：修 bug 时**必须先写一条能复现 bug 的失败测试再动手修**——否则你无法证明自己修的是这个 bug，也无法阻止它再次出现。

**常见误解**：以为「测试跑通了就没有回归」。测试只覆盖它断言过的部分，没写断言的行为照样能悄悄变坏。

也见 [TDD（测试驱动开发）](#tdd测试驱动开发test-driven-development)、[Smoke Test（冒烟测试）](#smoke-test冒烟测试)、[Test Coverage（测试覆盖率）](#test-coverage测试覆盖率)。

示例：[`28_testing/01_why_testing.js`](28_testing/01_why_testing.js)

### Flaky Test（不稳定测试）

不稳定测试指**同一份代码、同样的环境，有时通过有时失败**的测试。它比一直失败的测试更危险：团队会学会「重跑一次就好了」，于是真正的回归被当作噪声忽略。常见成因是时间（依赖真实时钟或固定 `setTimeout`）、并发与顺序（用例间共享状态）、外部依赖（网络、第三方服务）、未等待的异步操作、以及动画/布局的时序。关键细节：处理流程是「先隔离，再修或删」——把它单独跑一百次确认不稳定，然后找出不确定源（注入可控时钟、等待条件而非固定延时、彻底清理共享状态）；如果实在无法稳定且价值不高，**删掉**比留着更好。

**常见误解**：以为「加个重试就好了」。自动重试只是把问题藏起来，还会成倍拉长流水线时间。

也见 [Test Isolation（测试隔离）](#test-isolation测试隔离)、[End-to-End Test / E2E（端到端测试）](#end-to-end-test-e2e端到端测试)。

示例：[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### Testing Async Code（异步代码测试）

测试异步逻辑的核心难点是「**测试函数可能在回调/Promise 结算之前就返回了**」，此时运行器认为测试通过——这是最典型的假通过。正确做法是让测试函数本身 `async` 并 `await` 被测 Promise，或者显式 `return` 那个 Promise；断言「会拒绝」要用专门的 API（`assert.rejects`/`expect(...).rejects`）而不是把 `try/catch` 写反。关键细节：还要处理**永远不会结算**的 Promise——为用例设置超时（`node:test` 的 `{ timeout }`、Vitest 的 `testTimeout`），否则挂住的是整个流水线；定时器相关的逻辑最好使用可控时钟或把「等待」注入进来，避免真的 `sleep` 三秒。

**常见误解**：以为 `await` 了被测函数就一定测到了。如果被 `await` 的函数内部又启动了未被追踪的异步任务（fire-and-forget），测试仍可能在它完成前结束。

也见 [Test Isolation（测试隔离）](#test-isolation测试隔离)、[Flaky Test（不稳定测试）](#flaky-test不稳定测试)、[Assertion（断言）](#assertion断言)。

示例：[`28_testing/06_testing_async_code.js`](28_testing/06_testing_async_code.js)

### Test Double（测试替身）

测试替身是「**在测试中替代真实协作者的任何东西**」的总称，借自电影里的「替身演员」比喻。它包含五种常见形态：**dummy**（只是占位、从不被真正使用）、**stub**（返回预设值）、**spy**（记录调用事实）、**mock**（预设期望并自行判定成败）、**fake**（可工作的简化实现）。为什么要用它？因为真实的协作者可能很慢（数据库）、不稳定（第三方 API）、难以触发（磁盘写满、系统时间）、或根本不存在（尚未实现的模块）。关键细节：替身是**有代价**的——它把「真实协作方的行为」换成了「你以为的行为」，替身写错时测试会愉快地通过而线上照样炸，所以替身应尽量只用在系统边界上。

**常见误解**：把这几个词当同义词混用（尤其是 mock 与 stub）。术语混乱会导致沟通时说的不是一件事，本节把它们拆开说明。

也见 [Mock（模拟对象）](#mock模拟对象)、[Stub（桩）](#stub桩)、[Spy（间谍）](#spy间谍)、[Fake（伪造实现）](#fake伪造实现)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Mock（模拟对象）

Mock 是**预设了「应该被怎样调用」并据此自动判定成败**的替身：你对它写下期望（被调用一次、参数是 `{id: 1}`、携带某个头部），测试结束时由它来宣布「期望满足／未满足」。它验证的是**交互行为**（对象之间有没有按约定通信），而 stub 验证的是**状态**（拿到返回值后结果对不对）。关键细节：mock 的期望写得太细会把测试与实现细节焊死——重构时明明行为没变，测试却成片变红；因此优先断言「我关心的那次关键交互」，而不是把所有调用逐一录下来。

**常见误解**：把「mock」当成「一切替身」的口语说法，于是说「我 mock 了这个函数返回 42」时，其实指的是 stub。

也见 [Stub（桩）](#stub桩)、[Spy（间谍）](#spy间谍)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Stub（桩）

Stub 是**只负责「返回预设结果」的替身**：让某个依赖固定返回一个成功响应、一个 500、一个空数组或抛出一个错误，从而把被测代码推到你想验证的分支上。它不做任何判定，只提供**受控的输入**。典型用途是制造那些真实环境里很难出现的场景——网络超时、第三条记录损坏、余额不足。关键细节：stub 定义了「世界是怎样的」，因此要**写进断言的语境里**（这条用例在验证「上游 500 时不应写库」），否则别人读测试时会以为这是在描述真实依赖的行为。

**常见误解**：把 stub 当成 mock。判断标准很简单——**它有没有自己的期望判定逻辑**：只喂数据的是 stub，会主动判定调用是否合规的是 mock。

也见 [Mock（模拟对象）](#mock模拟对象)、[Fake（伪造实现）](#fake伪造实现)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Spy（间谍）

Spy 是**记录「被调用过几次、用什么参数、返回了什么、抛了什么」的替身**，通常不改变原函数的实现（可以「包住真实函数」来观察它）。它的使用方式与断言相反：先执行代码，再回过头检查记录——`expect(spy).toHaveBeenCalledWith(...)`。关键细节：spy 常用来验证**副作用**（日志被写入、事件被派发、回调被调用），这类行为没有返回值可断言；`vi.fn()`/`jest.fn()` 造出的其实是「同时具备 spy 与 stub 能力」的万能替身，可以通过 `mockImplementation` 再给它行为。

**常见误解**：以为 spy 会替换掉真实实现。包装式 spy 默认会**原样调用**真实函数，因此它通常不改变被测代码的行为，只是旁观。

也见 [Mock（模拟对象）](#mock模拟对象)、[Stub（桩）](#stub桩)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Fake（伪造实现）

Fake 是**具备真实可工作逻辑、但走了捷径**的替身：内存数据库替代真实数据库、内存队列替代消息中间件、假时钟替代 `Date`。它与 stub 的关键区别在于「**真的有行为**」——同一个 fake 可以被几十条用例复用，而不必为每条用例预设返回值。关键细节：fake 本身也需要测试（否则你测的是「假实现有 bug」还是「真代码有 bug」就分不清了），且它与真实实现的**语义差异**必须清楚——内存数据库没有事务隔离、没有约束冲突，这些差异会让通过了测试的代码在真实环境失效。

**常见误解**：以为 fake 一定不如真依赖。对大多数业务测试而言，可控的 fake 比不稳定的真实依赖更有价值；关键是别在需要验证集成契约的地方用它。

也见 [Stub（桩）](#stub桩)、[Test Double（测试替身）](#test-double测试替身)、[Integration Test（集成测试）](#integration-test集成测试)。

示例：[`28_testing/13_module_mocking.js`](28_testing/13_module_mocking.js)

### Module Mocking（模块级 mock）

模块级 mock 指**在导入层面替换整个模块**（`vi.mock('./db', ...)`、`jest.mock`、`mock.module()`），让被测代码里的 `import` 拿到替身而不是真货。它很有诱惑力，但也最容易出问题：ESM 的绑定是**只读且静态提升**的，模块在 `import` 语句求值时就已经被加载，测试文件里后写的替换往往根本没生效；同时「替换整个模块」通常说明被测代码**直接依赖了具体实现**，而不是依赖一个可注入的抽象。关键细节：正解通常是**依赖注入**——让被测函数把依赖当参数（或构造函数参数）接进来，测试直接传替身，无需触碰模块系统；只有在第三方库无法改造时才退回到模块 mock。

**常见误解**：以为「打不到内部 import」是运行器的 bug。这是 ESM 的语义设计，不是缺陷；也见本仓库专门讨论这一点的示例。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Fake（伪造实现）](#fake伪造实现)、[Mock（模拟对象）](#mock模拟对象)。

示例：[`28_testing/13_module_mocking.js`](28_testing/13_module_mocking.js)

### Test Dependency Injection（测试中的依赖注入）

依赖注入在测试语境下只有一个目的：**让被测代码不再自己创建依赖，而是从外部接收依赖**，于是测试可以在生产代码用真实数据库、测试代码用内存 fake 的情况下跑同一份逻辑。它把「测试替身」从「到处打补丁」变成「一次传参」。关键细节：注入点是构造函数参数、函数参数或配置对象；注入的是**抽象**（约定好的接口形状）而不是具体类，这样测试才能用任意对象顶上；这也是 TDD 会自然逼出的设计——因为写测试时你会立刻发现「这个依赖我拿不到」。

**常见误解**：以为 DI 必须引入框架或装饰器。在 JS 里，**把依赖当参数传进去**就已经是依赖注入了，框架只是替你自动装配。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Module Mocking（模块级 mock）](#module-mocking模块级-mock)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`30_design_patterns/19_dependency_injection.js`](30_design_patterns/19_dependency_injection.js)、[`28_testing/13_module_mocking.js`](28_testing/13_module_mocking.js)

## 第三方库与依赖

### Dependency（依赖）

依赖指「你的项目为正常运行而需要的**外部代码**」。它带来价值（不必重造轮子）也带来成本：体积、安全面、维护负担、许可证义务与升级风险。关键细节：依赖分运行时依赖与开发期依赖、直接依赖与传递依赖，它们的风险与升级策略完全不同；每一次添加依赖都是一次**长期承诺**——你之后要跟着它升版本、修安全通告、处理破坏性变更，因此「这个功能我能不能自己写 30 行」永远是值得先问的问题。

**常见误解**：以为「不加依赖 = 不专业」。恰恰相反，成熟的工程会把依赖清单当作需要定期审计的资产。

也见 [Direct vs Transitive Dependency（直接依赖与传递依赖）](#direct-vs-transitive-dependency直接依赖与传递依赖)、[Library Selection（第三方库选型）](#library-selection第三方库选型)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Direct vs Transitive Dependency（直接依赖与传递依赖）

**直接依赖**是你在 `package.json` 里亲手写下的包；**传递依赖**是这些包的依赖的依赖——你从未选择过它们，但它们的代码同样会跑在你的机器上。传递依赖的数量可能远超直接依赖（一个 5KB 的包拖进四十个包并不罕见），因此「依赖体积」必须看**传递依赖闭包**而不是包自身的体积。关键细节：传递依赖是你**无法直接控制版本**的部分，安全通告里出问题的往往正是它们；`npm ls <包名>` 可以查出「是谁把某个包引进来的」，这是排查体积膨胀与版本冲突的第一条命令。

**常见误解**：只看 `package.json` 就以为掌握了项目的依赖全貌。真正的依赖图要大得多，`node_modules` 才是它的物化形态。

也见 [Dependency（依赖）](#dependency依赖)、[Phantom Dependency（幽灵依赖）](#phantom-dependency幽灵依赖)、[Dependency Hell（依赖地狱）](#dependency-hell依赖地狱)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### dependencies / devDependencies / peerDependencies（三类依赖声明）

`package.json` 用三个字段区分依赖的**用途与生命周期**。`dependencies`：运行时需要，会随你的包一起被安装到使用者的项目里（如 `express`）；`devDependencies`：只在开发/构建/测试时需要，使用者装你的包时不会安装（如 `vitest`、`eslint`）；`peerDependencies`：声明「我要求宿主环境提供某个版本的这个包」，但**不替你安装**，用于插件与框架生态（如组件库要求 `react ^18`）。关键细节：分错的代价很实际——把只用于测试的包写进 `dependencies` 会让所有使用者多装一堆东西（并扩大攻击面）；把运行时需要的包写进 `devDependencies` 则会让别人装完就报「模块找不到」。`peerDependencies` 的哲学是「共享同一份实例」，避免 React 被装成两份导致 hooks 失效。

**常见误解**：以为 `peerDependencies` 也会被自动装上。现代 npm 会尝试自动安装并打印冲突警告，但它的**语义**始终是「由使用者提供」。

也见 [Dependency（依赖）](#dependency依赖)、[Semantic Versioning / semver（语义化版本）](#semantic-versioning-semver语义化版本)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Semantic Versioning / semver（语义化版本）

semver 用 `主版本.次版本.修订号`（`MAJOR.MINOR.PATCH`）三个数字约定版本变化对使用者意味着什么：**MAJOR** 升位代表有不兼容的破坏性变更，**MINOR** 升位是向后兼容的新功能，**PATCH** 升位是向后兼容的缺陷修复。它本质上是一份**承诺**，而不是数字规律：`1.2.3` 能升级到 `1.9.0` 是因为作者承诺没破坏兼容性。关键细节：`0.x.y` 是特例——按约定 `0` 开头的版本 API 尚未稳定，**次版本号升位就可能包含破坏性变更**，所以 `^0.2.1` 的行为与 `^1.2.1` 不同；此外 `1.0.0-beta.1` 这类预发布版本在版本范围匹配上有专门规则，通常不会被 `^1.0.0` 匹配到。

**常见误解**：以为 semver 能防住所有升级问题。承诺是作者单方面做出的，现实中「补丁版本里的行为变化」与「悄悄放宽依赖范围」都不罕见——这正是锁文件存在的理由。

也见 [Version Range（版本范围）](#version-range版本范围)、[Lockfile（锁文件）](#lockfile锁文件)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Version Range（版本范围）

版本范围写在 `package.json` 的版本值里，决定「`npm install` 时允许装到哪个版本」。最常用两个前缀：`^1.2.3`（脱字号）允许升到**不改变最左侧非零数字**的版本，即 `>=1.2.3 <2.0.0`；`~1.2.3`（波浪号）只允许升**修订号**，即 `>=1.2.3 <1.3.0`。此外还有 `1.2.x`、`>=1.2.3 <2`、`*`（任意版本）与 `latest` 等写法。关键细节：范围越宽，越容易在不改代码的情况下悄悄换掉依赖实现——`^` 是社区默认（因为相信 semver），`~` 更保守，精确锁死 `1.2.3` 最保守但会让你错过安全修复；`*` 与 `latest` 在库中基本等同于事故。

**常见误解**：以为 `^1.2.3` 表示「会装 1.2.3」。它表示「至少 1.2.3，且允许升到 1.x 的最新版」——**实际装到哪一版由锁文件决定**。

也见 [Semantic Versioning / semver（语义化版本）](#semantic-versioning-semver语义化版本)、[Lockfile（锁文件）](#lockfile锁文件)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Lockfile（锁文件）

锁文件（`package-lock.json`、`yarn.lock`、`pnpm-lock.yaml`）记录**上一次安装时实际装上的每一个包的精确版本与完整性校验值**，包括全部传递依赖。它解决的核心问题是**可复现性**：`package.json` 里的 `^1.2.3` 是范围，不同时间、不同机器上装出来的版本可能不同，而锁文件把「这次装了什么」钉死，让同事、CI、生产环境装出完全一致的依赖树。关键细节：锁文件必须**提交进版本库**；它同时是供应链防线的一环（记录了包的哈希），可以在 `npm ci` 时校验下载内容是否被篡改。

**常见误解**：以为「锁文件冲突就删掉重新生成」。这等于放弃可复现性，还会把大量无关依赖顺手升级；正确做法是解决冲突或按需重新解析并 review 差异。

也见 [npm ci](#npm-ci-与-npm-installnpm-ci-vs-npm-install)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### npm ci 与 npm install（npm ci vs npm install）

两者都能装依赖，语义却相反。`npm install` 会**按 `package.json` 的范围解析依赖**，允许把包升到范围内最新的版本，并据此**改写锁文件**——适合开发机上引入新依赖。`npm ci` 则**严格按锁文件安装**，完全不解析范围，如果锁文件与 `package.json` 不一致会直接报错退出，而且它会先清空 `node_modules` 再装，干净且快。关键细节：CI/CD 流水线**必须用 `npm ci`**——否则每次构建可能装上不同的传递依赖，「本地能跑、线上不行」的诡异问题多半源于此；反过来，在开发机上不该用 `npm ci` 来添加依赖，因为它不会更新锁文件。

**常见误解**：以为两者只差速度。它们对依赖图的确定性保证完全不同，这才是关键区别。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Version Range（版本范围）](#version-range版本范围)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Phantom Dependency（幽灵依赖）

幽灵依赖指**你的代码 import 了一个并没有写进自己 `package.json` 的包**，只是因为它恰好被别的依赖「提升（hoist）」到了顶层 `node_modules` 而能用。npm 为了去重会把依赖尽量拍平到顶层，于是 `require('lodash')` 可能在你没声明 lodash 的情况下也能成功。这非常危险：一旦那个间接引入它的包升级、换实现或被你删除，你的代码会在**没有任何改动的情况下突然崩掉**；换用 pnpm 这类严格隔离的包管理器时，同样的代码立刻报错。关键细节：防御手段是「只 import 自己声明过的包」，并用严格模式的包管理器或 lint 规则来暴露违规。

**常见误解**：以为「能 import 就说明可以用」。在扁平化安装的 `node_modules` 里，能 import 只是巧合。

也见 [Direct vs Transitive Dependency（直接依赖与传递依赖）](#direct-vs-transitive-dependency直接依赖与传递依赖)、[Dependency Hell（依赖地狱）](#dependency-hell依赖地狱)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Dependency Hell（依赖地狱）

依赖地狱指**依赖之间版本要求互相冲突**导致的无解状态：A 要求 `lib ^1`，B 要求 `lib ^2`，两者无法共存于同一份实例。典型症状是「装上了但运行时报奇怪的错」「明明升级了却还是旧行为」「同一个包存在多份副本导致 `instanceof` 失效」。关键细节：包管理器用「嵌套安装同一包的不同版本」来缓解，代价是体积膨胀与实例分裂；npm 的 `overrides`、pnpm 的 `resolutions` 可以强制统一版本，但那是把冲突按下去而不是解决它；根治办法是尽早升级掉那些锁死老版本依赖的包。

**常见误解**：以为「删除 `node_modules` 和锁文件重装」能解决依赖地狱。它会暂时让安装成功，却让版本变得不可复现，问题下次还会以别的形式回来。

也见 [Phantom Dependency（幽灵依赖）](#phantom-dependency幽灵依赖)、[Direct vs Transitive Dependency（直接依赖与传递依赖）](#direct-vs-transitive-dependency直接依赖与传递依赖)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Supply Chain Attack（供应链攻击）

供应链攻击指**攻击者不直接攻破你的系统，而是攻破你所依赖的上游**：劫持维护者账号发布带恶意代码的新版本、在 `postinstall` 脚本里执行窃密逻辑、仿冒包名（typosquatting）、或利用依赖混淆把内网包名抢注到公共仓库。它的效力来自「信任传递」——你信任 A，A 信任 B，最终 B 的恶意代码在你的生产环境里以完整权限运行。关键细节：防御是多层组合——提交并用 `npm ci` 复现锁文件、用 `npm audit` 跟踪已知漏洞、安装脚本管控（`--ignore-scripts`）、依赖数量最小化、SRI 保护第三方脚本；同时要认识到**没有银弹**，这类攻击的平均发现周期以月计。

**常见误解**：以为「我只用大厂维护的热门包就安全」。热门包与维护者账号恰恰是收益最高的攻击目标，历史事件多出于此。

也见 [Typosquatting / Dependency Confusion（仿冒包名与依赖混淆）](#typosquatting-dependency-confusion仿冒包名与依赖混淆)、[SRI（子资源完整性）](#sri-subresource-integrity子资源完整性)、[Lockfile（锁文件）](#lockfile锁文件)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Library Selection（第三方库选型）

选型是在「自己写」与「引入依赖」之间做的一次成本权衡，评估维度通常有六项：**体积**（压缩后体积 + 传递依赖闭包 + 是否支持 tree-shaking）、**维护状态**（最近提交、issue 响应、发版节奏）、**类型支持**（自带 `types` 还是需要 `@types`）、**许可证**（MIT/Apache 友好，GPL 类可能传染）、**安全记录**、以及**替换成本**（API 是否容易抽象遮蔽）。关键细节：优先选「小而专注」的库（dayjs 之于 moment、zod 之于重量级校验框架），并对关键依赖做一层**薄封装**——这样将来替换时只改一个文件；同时要问「这个功能我用 30 行标准 API 能不能写出来」。

**常见误解**：只看 GitHub star 数。star 高不等于维护活跃，也完全不能反映体积、许可证与安全记录。

也见 [Dependency（依赖）](#dependency依赖)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Structured Logging（结构化日志）

结构化日志指**以「带字段的结构化数据」而不是拼接好的字符串**来记录事件：输出 `{"level":"info","msg":"user login","userId":42,"durationMs":18}` 而不是 `"user 42 login in 18ms"`。为什么重要？因为纯文本日志只能靠正则去猜，而结构化日志可以直接按字段查询、聚合、告警——`level=error AND service=api` 变成一条查询语句。关键细节：主流方案是**每行一条 JSON**（NDJSON，也叫 JSON Lines），便于日志系统逐行解析与流式采集；同时要遵循**字段命名约定**（`level`/`time`/`msg`/`traceId`）并保持稳定，字段名朝令夕改会让历史日志无法与新的聚合查询对齐。

**常见误解**：以为「用 `console.log` 打印一个对象」就是结构化日志。Node 的 `console.log` 输出的是**给人和调试器看的格式**（多行、非严格 JSON、带颜色），机器无法可靠解析。

也见 [Log Level（日志级别）](#log-level日志级别)、[Log Collection（日志采集）](#log-collection日志采集)、[Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）](#sensitive-data-exposure-log-redaction敏感信息泄漏与日志脱敏)。

示例：[`29_npm_libraries/14_logging.js`](29_npm_libraries/14_logging.js)

### Log Level（日志级别）

日志级别是一套**按严重程度排序的过滤开关**，常见从低到高为 `trace`/`debug`/`info`/`warn`/`error`/`fatal`。运行环境通过设定一个阈值来决定「只输出不低于该级别的日志」：开发环境用 `debug` 看细节，生产环境用 `info` 甚至 `warn` 控制成本与噪声。关键细节：级别应当有**明确契约**——`error` 表示「需要人介入」，`warn` 表示「可能有问题但系统仍可用」，`info` 表示「值得记录的正常业务事件」，`debug` 表示「排查时才有用的细节」；把「可预期的用户输入错误」（如密码错误）记成 `error` 会让告警疲于奔命，最终没人看。

**常见误解**：以为级别越高越重要所以要「多打 error」。级别混乱的日志系统里，真正的错误会被淹没在成千上万条伪 error 中。

也见 [Structured Logging（结构化日志）](#structured-logging结构化日志)、[Log Collection（日志采集）](#log-collection日志采集)。

示例：[`29_npm_libraries/14_logging.js`](29_npm_libraries/14_logging.js)

### Log Collection（日志采集）

日志采集指把应用产出的日志**汇总到一处可查询、可告警的存储**（进程 stdout → 采集代理 → 日志服务或 ELK/Loki）。它与「打印日志」是两件事：打印只是把行写到标准输出，采集负责缓冲、批量化、加元数据（主机、容器 ID、时间戳）、转发与保留策略。关键细节：容器化环境的最佳实践是**应用只写 stdout/stderr，不自己写文件**——由运行时负责收集，这样应用不必关心落盘、切割与轮转；同时要通过 `traceId` 之类的关联字段把分散在多台机器上的同一次请求日志串起来，否则分布式系统里的日志等于一堆孤立的碎片。

**常见误解**：以为「日志打出来了就等于能查到」。没有采集链路的日志在容器重启后就永久消失了。

也见 [Structured Logging（结构化日志）](#structured-logging结构化日志)、[Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）](#sensitive-data-exposure-log-redaction敏感信息泄漏与日志脱敏)。

示例：[`29_npm_libraries/14_logging.js`](29_npm_libraries/14_logging.js)

### ORM（对象关系映射，Object-Relational Mapping）

ORM 把**数据库的表和行映射成编程语言里的对象**，让你用方法调用而不是拼 SQL 来读写数据（`user.save()` 对应 `UPDATE`，`User.findAll({ where: {...} })` 对应 `SELECT`）。它的价值是消除样板代码、提供类型提示、内置迁移与关联加载；代价是**抽象泄漏**——复杂查询最终仍要甩回原生 SQL，而 ORM 自动生成的低效查询（典型是 N+1：查 100 个用户后又为每个用户发一条查订单的语句）会成为性能黑洞。关键细节：ORM 不是必需品，轻量项目直接用驱动（如 `node:sqlite`）写 SQL 往往更透明；用 ORM 时一定要开启查询日志，看清它到底发了什么 SQL。

**常见误解**：以为用了 ORM 就天然安全。ORM 确实让参数化查询成为默认，但 `where` 里拼字符串、或用原生查询接口时照样能写出 SQL 注入。

也见 [SQLite（SQLite）](#sqlitesqlite)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)、[SQL Injection（SQL 注入）](#sql-injectionsql-注入)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)

### SQLite（SQLite）

SQLite 是一个**无服务器、零配置、单文件的嵌入式关系数据库**：整个库就是一个 `.db` 文件，没有独立进程、没有网络协议，直接以函数调用方式读写磁盘。Node.js 通过内置的 `node:sqlite` 模块即可使用，无需任何第三方依赖。它的适用面比很多人以为的宽——从手机 App、桌面软件到中型网站都能胜任；局限是**写并发**：默认同一时刻只允许一个写事务，高并发写入场景需要换客户端/服务器型数据库。关键细节：SQLite 的并发默认靠文件锁实现，开启 WAL 模式可以显著改善读写并发；它同样是 SQL 注入的受害者，防御方式与其它数据库一致。

**常见误解**：以为「嵌入式 + 单文件 = 玩具」。世界上的 SQLite 实例数量远超其它所有数据库的总和。

也见 [ORM（对象关系映射）](#orm对象关系映射object-relational-mapping)、[Connection Pool（连接池）](#connection-pool连接池)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)

### Repository Pattern（仓储模式）

仓储模式在业务逻辑与数据访问之间加一层**面向领域的接口**：业务代码只说 `userRepo.findById(id)` 或 `orderRepo.save(order)`，不关心底层是 SQL、是内存数组还是远程 API。它带来两个直接收益——**可测试性**（测试注入内存实现即可，不需要数据库）与**可替换性**（换存储只改一处）。关键细节：仓储应当返回**领域对象**而不是数据库行，方法应当以业务语义命名（`findActiveUsers()` 而不是 `query("SELECT * ...")`）；要避免把仓储写成「数据库的薄包装」——如果它的方法名和 SQL 关键字一一对应，那这层抽象没有创造任何价值。

**常见误解**：以为 Repository 就是 ORM 的别名。ORM 是**技术手段**（映射工具），Repository 是**架构边界**（谁有权访问数据），可以在没有 ORM 的情况下手写仓储。

也见 [ORM（对象关系映射）](#orm对象关系映射object-relational-mapping)、[Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)、[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### Connection Pool（连接池）

连接池预先维护一批**已建立的数据库连接并循环复用**，避免每次查询都经历「建立 TCP/握手/认证/关闭」的完整开销。它的存在是因为连接是昂贵资源：建立一次连接可能耗时几十毫秒，而一条查询只需几毫秒——不复用的话，连接开销会完全压过业务本身。关键细节：池的大小需要与**数据库的最大连接数**一起规划，池总和超过数据库上限会直接把数据库打垮；池中连接要能检测失效并重建（数据库重启、空闲超时都会让连接变成坏连接），归还连接必须放在 `finally` 里，否则一次异常就会永久漏掉一个连接直到池枯竭。

**常见误解**：以为池越大越好。过大的池会增加数据库上下文切换与内存压力，反而降低总吞吐，通常每实例十几到几十条就够了。

也见 [SQLite（SQLite）](#sqlitesqlite)、[Circuit Breaker（熔断器）](#circuit-breaker熔断器)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)

### Retry（重试）

重试指在操作失败后**再试一次或几次**，用来应对偶发的瞬时故障（网络抖动、连接被重置、服务临时过载）。它成立的前提是**失败是暂时的**——对「参数校验失败」这类确定性错误重试一万次结果都一样，只会浪费资源。关键细节：必须设**上限**（最大次数或总时长），必须只对**可重试的错误**重试（5xx、超时、连接错误可重试；4xx 业务错误不可），并且要保证被重试的操作是**幂等**的，否则一次「超时但其实成功了」的请求重试后会变成重复下单。

**常见误解**：以为重试是「增强可靠性」的万能药。多个层级各加重试会形成**重试风暴**，把一次小故障放大成雪崩。

也见 [Exponential Backoff（指数退避）](#exponential-backoff指数退避)、[Idempotency（幂等性）](#idempotency幂等性)、[Circuit Breaker（熔断器）](#circuit-breaker熔断器)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Exponential Backoff（指数退避）

指数退避要求每次重试之间的等待时间**按倍数增长**（例如 100ms、200ms、400ms、800ms），而不是固定间隔。理由是：如果故障来自「服务被压垮」，固定间隔的重试会以恒定的速率继续施压，让它永远缓不过来；指数增长的间隔给了系统恢复空间，也让重试总量在时间上有界。关键细节：要设**最大间隔上限**，否则退避会增长到荒谬的分钟级；等待时间通常用一个系数（常见 2）乘以基础延迟，并结合抖动打散；此外，「重试总预算」比「重试次数」更能保护系统——限制整个请求最多花 5 秒在重试上。

**常见误解**：以为退避只是为了「让日志好看点」。它真正的作用是**给下游恢复的时间**，是防止重试放大故障的核心机制。

也见 [Retry（重试）](#retry重试)、[Jitter（抖动）](#jitter抖动)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Jitter（抖动）

抖动指在退避计算出的等待时间上**加上一份随机扰动**（如 `delay * (0.5 + Math.random())`）。没有抖动时，成百上千个客户端会在故障发生后**按同样的节奏同时重试**（因为它们看到的是同一次故障、用的是同一个公式），形成周期性的浪涌，把刚刚恢复的服务再打垮一次。抖动把这些请求在时间轴上抹平，让负载曲线变得平滑。关键细节：常见变体有「全抖动」（在 `[0, delay]` 内随机）、「等抖动」（在 `[delay/2, delay]` 内随机）与「去相关抖动」；实践中只要加了抖动，收益就比不加高一个量级。

**常见误解**：以为抖动是「让结果更随机、更不稳定」。它恰恰是让**系统级行为**更稳定的手段，单次请求的延迟略微不确定，换来的是一群客户端不再同步行动。

也见 [Exponential Backoff（指数退避）](#exponential-backoff指数退避)、[Retry（重试）](#retry重试)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Idempotency（幂等性）

幂等性指**同一个操作执行一次与执行多次，对系统状态的影响相同**。它是重试能够安全存在的前提：如果「扣款 100 元」不是幂等的，那么一次超时后的重试就会让用户被扣 200 元。在 HTTP 语义里，`GET`/`PUT`/`DELETE` 按约定是幂等的，`POST` 通常不是。关键细节：让非幂等操作变得幂等的标准做法是**幂等键（idempotency key）**——客户端为每次业务操作生成一个唯一 ID 随请求发送，服务端首次处理时记录该键与结果，之后遇到同一个键就直接返回上次的结果而不是重复执行；这个记录必须与业务写入在**同一个事务**里落库，否则「写成功但记录没写成」的窗口里仍会重复执行。

**常见误解**：以为「没有副作用」才叫幂等。幂等说的是**多次执行后的最终状态**与一次相同，而不是「什么都没发生」——`DELETE` 第二次删已经删掉的资源返回 404 或 204 都不影响幂等性。

也见 [Retry（重试）](#retry重试)、[Exponential Backoff（指数退避）](#exponential-backoff指数退避)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Circuit Breaker（熔断器）

熔断器是**当某个下游持续失败时主动切断对它的调用**的保护机制，灵感来自电路保险丝：错误累积到阈值后从「闭合」跳到「断开」，此后一段时间内所有请求**立刻失败**而不去尝试；过了冷却期进入「半开」状态，放少量请求试探，成功则恢复闭合，失败则继续断开。它和重试解决的是不同问题：重试试图让单次调用成功，熔断则承认「这个下游已经坏了」，把资源留给还健康的部分——否则大量请求会卡在等待超时上，把调用方的线程/内存耗尽，故障从下游蔓延到上游。关键细节：超时设置是熔断生效的前提（没有超时就永远等不到「失败」这个信号）；熔断后要给用户一个明确的降级响应（缓存数据、默认值或友好错误），而不是无声地吞掉。

**常见误解**：以为熔断会影响业务成功率所以不该开。没有熔断时，故障期间几乎 100% 的请求都会挂在超时上；熔断至少能保证「快速失败 + 降级」，用户体验反而更好。

也见 [Retry（重试）](#retry重试)、[Connection Pool（连接池）](#connection-pool连接池)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

## 设计模式

### Design Pattern（设计模式）

设计模式是**针对反复出现的软件设计问题，被反复验证过的可复用解法**。它不是可以直接复制的代码，而是一套「问题—上下文—方案—后果」的描述：说明在什么约束下、用什么结构来组织类与对象的关系。它真正的价值在于**共享词汇**——说「这里用责任链」比花十分钟画图更能让同事立刻理解设计意图。关键细节：模式是**描述性的而不是规定性的**，它记录的是「人们已经这么写了」，而不是「你应该这么写」；JS 因为有一等函数、闭包、原型链与模块系统，很多 GoF 模式（策略、命令、观察者）可以退化成「传一个函数」，照搬 Java 式的类结构只会徒增样板代码。

**常见误解**：以为「用了模式就是好设计」。强行套用模式是典型的过度设计；模式应当在你**已经感到结构上的痛**之后才被引入。

也见 [Anti-pattern（反模式）](#anti-pattern反模式)、[Over-engineering（过度设计）](#over-engineering过度设计)、[GoF（四人组）](#gof四人组gang-of-four)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### GoF（四人组，Gang of Four）

GoF 指 1994 年出版《设计模式：可复用面向对象软件的基础》的四位作者（Erich Gamma、Richard Helm、Ralph Johnson、John Vlissides），书名常被简称为「GoF 书」。这本书把设计模式**系统化**成一套有共同结构（意图、动机、结构图、参与者、协作、后果）的目录，收录了 23 个经典模式，并划分成创建型、结构型、行为型三类。关键细节：GoF 模式全部围绕「类与对象的组织」展开，写法带强烈的 C++/Java 色彩；JS 有闭包与一等函数，许多模式的实现形式与书中不同（例如策略模式常是一个字典，装饰器模式常是高阶函数），但**意图**完全相通。

**常见误解**：以为「设计模式」就等于「GoF 那 23 个」。GoF 只是最有名的一次整理，JS 生态里还有模块模式、中间件（责任链的变体）、Mixin、EventBus 等自己的模式词汇。

也见 [Creational / Structural / Behavioral（创建型、结构型、行为型）](#creational-structural-behavioral创建型结构型行为型)、[Design Pattern（设计模式）](#design-pattern设计模式)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### Creational / Structural / Behavioral（创建型、结构型、行为型）

这是 GoF 对 23 个模式的三大分类，依据是「这个模式主要在解决哪一类问题」。**创建型**关注「对象怎么被造出来」，把实例化过程从使用方解耦（单例、工厂、建造者、原型、抽象工厂）；**结构型**关注「对象与类怎么组合成更大的结构」，在保持接口可用的前提下改变结构（适配器、装饰器、代理、外观、组合、享元、桥接）；**行为型**关注「对象之间怎么分工与通信」，把职责与算法分配出去（观察者、策略、状态、命令、责任链、模板方法、中介者、备忘录、访问者、迭代器）。关键细节：分类是**记忆与检索的工具**，不是硬边界——同一个问题常可用不同类别的模式解决（比如「避免一堆 if-else」既可以用策略（行为型）也可以用表驱动（无模式））。

**常见误解**：以为「创建型只管创建、结构型只管结构」，于是纠结某个模式该放哪一类。分类的用途是帮你在面对问题时想起「这一类里有哪些可选项」。

也见 [GoF（四人组）](#gof四人组gang-of-four)、[Design Pattern（设计模式）](#design-pattern设计模式)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)、[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Module Pattern（模块模式）

模块模式是**用 IIFE（立即调用函数表达式）加闭包造出私有作用域**的经典 JS 模式：函数立刻执行，在内部定义变量与函数，只把愿意公开的部分作为对象返回，外部无法触碰闭包里的私有成员。它出现在 ESM 之前，解决的是「`<script>` 时代所有变量都挤在全局作用域里互相覆盖」的问题，也是「用闭包实现私有状态」这一技巧的原型。关键细节：在原生 ESM 普及后，模块模式**大部分已被取代**——模块文件自带作用域、`export` 就是公开接口，不需要再手工包一层 IIFE；但它并没有过时，其精神（只暴露必要接口、隐藏内部状态）在 IIFE 级私有变量、`#private` 字段与工厂函数里依然处处可见。

**常见误解**：以为「模块模式」就是「ES 模块」。前者是一种手写技巧，后者是语言级的模块系统，二者解决的问题相同、实现层次完全不同。

也见 [Singleton（单例模式）](#singleton单例模式)、[Design Pattern（设计模式）](#design-pattern设计模式)。

示例：[`30_design_patterns/01_module_pattern.js`](30_design_patterns/01_module_pattern.js)

### Singleton（单例模式）

单例模式保证**一个类在全局只有一个实例，并提供访问它的统一入口**。它适用于「本质上唯一」的资源：应用配置、日志器、数据库连接池、事件总线。JS 里实现单例的方式很多——模块顶层导出的对象天然就是单例（模块只会被求值一次）、闭包持有私有实例、静态字段与 `getInstance()` 方法。关键细节：单例最大的问题是**隐式的全局状态**——它让依赖关系从函数签名里消失（看不出这个函数用了全局配置），也让测试互相污染（上个用例改过的单例状态留给了下个用例）。因此现代实践是：优先用**依赖注入**传递「唯一的那个实例」，而不是让代码去主动 `getInstance()`。

**常见误解**：以为单例能保证「只有一个」，在有多份模块副本（依赖地狱、打包重复）或跨进程/跨 Worker 的场景里，实际会存在多个实例。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Module Pattern（模块模式）](#module-pattern模块模式)。

示例：[`30_design_patterns/02_singleton.js`](30_design_patterns/02_singleton.js)

### Factory（工厂模式）

工厂模式把**「创建对象」这件事从使用方手里拿走**，交给一个专门的函数或类来决定造什么、怎么造。使用方只说「给我一个支付处理器」，不再 `new` 一个具体类，于是新增类型不需要改调用处——这正是它相对 `if/else` 加 `new` 的核心收益。常见形态有简单工厂（一个函数内部 `switch` 返回不同实现）、工厂方法（子类决定实例化哪个类）与抽象工厂（创建一族的相互关联对象，如「一整套 UI 控件」）。关键细节：工厂还适合承担**参数校验、缓存复用与异步初始化**等构造逻辑；但如果没有多种类型要选，直接 `new` 或直接调用构造函数更清晰——工厂的价值随「类型分支数量」增长。

**常见误解**：以为工厂能消除 `if/else`。它只是把分支收拢到了一个地方（这已经很有价值），分支本身仍然存在；消除分支的是表驱动或策略模式配合注册机制。

也见 [Builder（建造者模式）](#builder建造者模式)、[Strategy（策略模式）](#strategy策略模式)、[Adapter（适配器模式）](#adapter适配器模式)。

示例：[`30_design_patterns/03_factory.js`](30_design_patterns/03_factory.js)

### Builder（建造者模式）

建造者模式把**复杂对象的构造过程拆成一步步的调用**，最后用一个 `build()` 收口。它针对的是「构造参数太多、可选参数太多」的经典痛点：与构造函数里塞八个位置参数相比，`new Query().select('*').from('users').where({id:1}).limit(10).build()` 每个参数都有名字、顺序无关、可以只设置关心的那些。关键细节：`build()` 是模式的灵魂——它负责**校验必填项**与**产出合法对象**，让「半成品对象」没有机会流出去；builder 通常设计成**不可变**的（每步返回新实例）以避免复用同一个 builder 时状态串味。JS 里这个模式最著名的应用就是查询构造器与请求构造器。

**常见误解**：以为链式调用就是建造者。链式调用只是一种语法形式，关键在「分步构建 + 最终校验产出」，如果一个 `build()` 只是把参数原样打包，那可能只是不必要的包装。

也见 [Factory（工厂模式）](#factory工厂模式)、[Command（命令模式）](#command命令模式)。

示例：[`30_design_patterns/04_builder.js`](30_design_patterns/04_builder.js)

### Observer（观察者模式）

观察者模式建立**「主题（Subject）—观察者（Observer）」的一对多依赖**：主题维护一份观察者列表，状态变化时逐个通知；观察者实现统一的更新接口，从而在**不知道主题具体是谁**的前提下被动接收变化。它解决的问题是「发布者不应该硬编码依赖所有关心它的人」。关键细节：观察者模式里双方是**彼此直连**的——主题直接持有观察者的引用并调用其方法，这意味着互不知道的对角线耦合仍存在；通知时机与顺序、观察者中途增删、以及「通知过程中抛错如何不影响其它观察者」都需要专门处理。

**常见误解**：把观察者模式与发布订阅模式当成同一个东西。它们长得像，耦合结构却不同，也见下一条。

也见 [Publish/Subscribe（发布订阅模式）](#publishsubscribe发布订阅模式)、[Mediator（中介者模式）](#mediator中介者模式)。

示例：[`30_design_patterns/05_observer.js`](30_design_patterns/05_observer.js)

### Publish/Subscribe（发布订阅模式）

发布订阅模式在发布者与订阅者之间插入一个**中间层（事件总线/消息代理）**：发布者只 `emit('user:created', data)`，订阅者只 `on('user:created', handler)`，双方**互不认识、甚至不知道对方存在**，只认识事件名和那个 `EventBus`。这正是它与观察者模式的根本区别——观察者是「主题直接通知它的观察者」（两端互相持有引用），发布订阅是「大家都只跟中间的代办打交道」（完全解耦，代价是多了一个需要管理生命周期的中介）。JS 里的 `EventTarget`/`addEventListener`、Node 的 `EventEmitter`、各类 EventBus 都是这一模式；它也是响应式编程与框架状态管理的地基。

**常见误解**：以为发布订阅只是「观察者模式换了个名字」。多出的那一层不是修辞——它让发布者可以不知道订阅者是谁（跨模块、跨进程通信成为可能），也带来新的问题：事件名变成事实上的公共契约，且**订阅未取消就会内存泄漏**。

也见 [Observer（观察者模式）](#observer观察者模式)、[Mediator（中介者模式）](#mediator中介者模式)、[Chain of Responsibility（责任链模式）](#chain-of-responsibility责任链模式)。

示例：[`30_design_patterns/06_pubsub.js`](30_design_patterns/06_pubsub.js)

### Strategy（策略模式）

策略模式把**一组可互换的算法**各自封装成对象（或函数），让调用方在运行时选用其中一个。它消灭的是那种「一个函数里塞满 `if (type === 'a') ... else if (type === 'b') ...`」的结构，把每个分支抽出去独立演进、独立测试。典型形态是一个映射表：`const strategies = { alipay: payByAlipay, wechat: payByWechat }`，使用时 `strategies[type](order)`。关键细节：策略之间的关系是**平等的、可替换的**，调用方主动选择用哪个；策略通常是无状态的纯算法（同样的输入给同样的输出），因此可以自由复用。

**常见误解**：以为策略模式和状态模式差不多。区别在于**谁来决定切换**——策略由外部调用方选，状态由对象自己随内部状态迁移，也见下一条。

也见 [State（状态模式）](#state状态模式)、[Template Method（模板方法模式）](#template-method模板方法模式)、[Factory（工厂模式）](#factory工厂模式)。

示例：[`30_design_patterns/07_strategy.js`](30_design_patterns/07_strategy.js)

### State（状态模式）

状态模式让**对象的行为随内部状态的改变而改变**：把每个状态封装成独立的对象，每个状态对象自己决定「在这个状态下，某个操作该怎么做」，以及「做完之后要不要切换到别的状态」。例如订单在「待支付」状态下调用 `cancel()` 可以成功，在「已发货」状态下 `cancel()` 应当被拒绝——同一个方法、不同的状态、不同的行为。关键细节：与策略模式的核心分野在于**状态迁移由谁触发**——策略模式的选择来自外部（调用方挑算法），状态模式的切换发生在内部（状态对象把下一个状态「交接」出去），并且状态之间构成一张**有向的迁移图**，非法迁移需要显式禁止。

**常见误解**：以为状态模式只是「策略模式加上一个 currentState 字段」。真正的状态模式里，状态对象自己推动迁移（`this.order.setState(new ShippedState())`），而策略模式的对象彼此不知道对方的存在。

也见 [Strategy（策略模式）](#strategy策略模式)、[Memento（备忘录模式）](#memento备忘录模式)。

示例：[`30_design_patterns/14_state.js`](30_design_patterns/14_state.js)

### Decorator Pattern（装饰器模式）

装饰器模式**在不修改原对象、也不改变其接口的前提下，动态地给对象叠加新能力**：装饰器包裹被装饰对象，转发调用并在前后插入额外逻辑。经典例子是「给一个数据源加上加密层、再加上压缩层」，组合顺序决定处理顺序。JS 里因为函数是一等公民，最常见的形式是**高阶函数**——`withLogging(withTiming(fn))`，这让日志、计时、缓存、鉴权、重试这些横切关注点可以像积木一样自由拼装。关键细节：装饰器与原对象**接口必须一致**（这也是它和适配器的分界，适配器是转换接口）；装饰顺序不可交换，且层数太多时调用栈会变长、调试会变难。

**常见误解**：把装饰器模式和 TC39 的 `@decorator` 语法当成同一件事。前者是设计模式（可以纯手工用高阶函数实现），后者是语言级的语法特性，用来更简洁地表达这类包装（见下一条）。

也见 [Adapter（适配器模式）](#adapter适配器模式)、[Proxy Pattern（代理模式）](#proxy-pattern代理模式)、[TC39 Decorator Syntax（TC39 装饰器语法）](#tc39-decorator-syntaxtc39-装饰器语法)。

示例：[`30_design_patterns/08_decorator.js`](30_design_patterns/08_decorator.js)

### TC39 Decorator Syntax（TC39 装饰器语法）

TC39 装饰器是**写在类、方法、访问器或字段前面的 `@expression` 语法**（目前处于 Stage 3 提案阶段），由运行时在定义时调用被装饰的目标，从而把「包装」这件事从手工嵌套变成声明式写法：`@logged @timed class Service {}`。它主要服务元编程场景——日志、依赖注册、校验、序列化配置。关键细节：装饰器的完整语义（新旧提案差异、是否支持参数装饰器、`accessor` 关键字、`addInitializer`）仍在演进，不同运行环境与转译器的支持程度不同，因此在生产代码里需要**做能力检测或依赖转译**；在 Node 中通常需要显式开启实验标志。本仓库的示例同时给出「原生不可用时的手写等价实现」。

**常见误解**：以为装饰器只能用在类上。现代提案同样支持方法、`getter`/`setter`、字段与自动访问器 `accessor`，能力范围取决于实现阶段。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)。

示例：[`30_design_patterns/20_decorator_syntax.js`](30_design_patterns/20_decorator_syntax.js)

### Adapter（适配器模式）

适配器模式**把「不兼容的接口」转换成「调用方期望的接口」**，让原本无法协作的两段代码能接上。现实中的类比是电源转接头：设备要的形状和你手里的插座不同，加一层转换即可，设备与插座本身都不需要改。典型场景是「统一多个第三方 SDK」——支付宝、微信、Stripe 各有各的方法名与返回结构，包一层适配器后对外都暴露 `pay(order)`，业务代码只认这一个接口。关键细节：适配器**改变接口而不改变功能**（对比装饰器：不改变接口而增强功能；对比外观：把多个接口简化成一个）；适配器是隔离外部变化的天然边界，也是「将来要换库」时成本最低的写法。

**常见误解**：以为适配器只是「多写一层没用的包装」。它的价值恰恰在于把「外部世界的不确定性」关进一个文件里，让变化不再扩散。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Facade（外观模式）](#facade外观模式)。

示例：[`30_design_patterns/09_adapter.js`](30_design_patterns/09_adapter.js)

### Proxy Pattern（代理模式）

代理模式提供一个**和真实对象接口完全相同的替身**，在把调用转给真实对象的前后插入控制逻辑。与装饰器「增强功能」不同，代理的意图是**控制访问**，常见四种：**保护代理**（鉴权，无权限直接拒绝）、**虚拟代理**（延迟创建昂贵对象，比如图片占位符）、**缓存代理**（命中缓存就不转发）、**远程代理**（本地对象代表远端服务）。关键细节：ES6 的 `Proxy` 是**语言级的元编程特性**，可以拦截 `get`/`set`/`has`/`apply`/`construct` 等内部操作，用来实现响应式追踪、不可变校验、默认值与日志——它是实现代理模式的利器，但**「语言的 Proxy」不等于「代理模式」**：代理模式的核心是「同接口 + 控制访问」这个意图，用 `Proxy` 也可以实现出与代理模式毫无关系的功能，而手写一个同名方法的包装类就已经是代理模式了。

**常见误解**：以为「用了 `Proxy` 就是用了代理模式」，或者以为「没用到 `Proxy` 就不是代理模式」。前者混淆了工具与意图，后者忽略了手写包装同样成立。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Facade（外观模式）](#facade外观模式)、[Adapter（适配器模式）](#adapter适配器模式)。

示例：[`30_design_patterns/10_proxy_pattern.js`](30_design_patterns/10_proxy_pattern.js)

### Command（命令模式）

命令模式把**「一次操作」本身封装成对象**，对象里同时带着「怎么执行」和撤销所需的信息。一旦请求成为对象，它就获得了数据的全部能力：可以被排队、被记录成日志、被序列化、被组合成宏命令、被放进历史栈里回滚。典型场景是编辑器的撤销/重做、任务队列、事务与操作审计。关键细节：命令对象通常约定 `execute()` 与 `undo()` 两个方法（`undo` 需要保存执行前的状态快照或反操作）；「宏命令」是命令的**组合**（一个命令内部持有一批命令，按序执行、逆序撤销），这正是组合模式与命令模式的交界处。

**常见误解**：以为命令模式必须有 `undo`。撤销只是它最有名的用途之一，把请求对象化以便排队、重放与日志记录同样成立。

也见 [Memento（备忘录模式）](#memento备忘录模式)、[Composite（组合模式）](#composite组合模式)。

示例：[`30_design_patterns/11_command.js`](30_design_patterns/11_command.js)

### Chain of Responsibility（责任链模式）

责任链模式把**若干个处理者串成一条链**，请求沿链传递，每个处理者自行决定「处理掉」「加工后继续传递」还是「直接放行」。它把「谁处理这个请求」与「请求本身」解耦，新增处理环节只需在链上插入一个节点，不必改动已有节点。它最广为人知的 JS 形态就是 **HTTP 中间件**：日志中间件、鉴权中间件、解析中间件依次执行 `next()`，任何一环都可以提前结束响应。关键细节：链可以是**单向直行**也可以是**双向的洋葱模型**（请求与响应各走一遍，如 Koa 的 `compose`）；要警惕「请求走到链尾却没人处理」的静默失败，通常需要一个终结处理者或显式的 404 兜底。

**常见误解**：以为链上的每一环都必须处理请求。责任链的价值恰恰在于「不处理就放行」——每环只关心自己那部分职责。

也见 [Command（命令模式）](#command命令模式)、[Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Template Method（模板方法模式）](#template-method模板方法模式)。

示例：[`30_design_patterns/12_chain_of_responsibility.js`](30_design_patterns/12_chain_of_responsibility.js)

### Template Method（模板方法模式）

模板方法模式在父类里定义好**算法的骨架**（一组按固定顺序调用的步骤），把其中若干步骤留给子类去实现。「固定的流程」与「可变的一步」被分开，子类只能改填空处，无法（也不该）改流程本身。典型场景是构建流程、数据处理管道、测试基类：`run()` 依次调用 `setup()`、`execute()`、`teardown()`，子类只实现后三个。关键细节：它与策略模式解决的是同一类问题（可变行为如何被替换），但**复用方式相反**——模板方法靠**继承**复用固定的骨架，策略模式靠**组合**替换整个算法，因此策略更灵活（可运行时换、可组合、无继承耦合），模板方法更简单（流程显而易见）。在鼓励组合优于继承的现代 JS 里，模板方法的很多场景已被「传入一个配置对象/回调」取代。

**常见误解**：以为模板方法只能是抽象类。JS 里继承不是必须的——一个接收回调的高阶函数同样表达了「骨架固定、步骤可换」的意图。

也见 [Strategy（策略模式）](#strategy策略模式)、[Chain of Responsibility（责任链模式）](#chain-of-responsibility责任链模式)。

示例：[`30_design_patterns/15_template_method.js`](30_design_patterns/15_template_method.js)

### Facade（外观模式）

外观模式为**一组复杂的子系统提供一个简化的统一接口**，让调用方不必了解内部的类与调用顺序。典型例子是一个 `bootstrap()` 函数，内部依次完成读配置、建连接池、注册路由、挂载中间件、启动监听，调用者只写一行。它带来两个收益：使用侧认知负担下降，以及子系统变化被隔离在门面之后。关键细节：外观**不禁止**直接访问子系统（它是便利层而非强制边界），也不增加新功能；它与适配器的区别在于——适配器是为了让**不兼容的接口能对接**（面向单个被适配者、接口形状被迫改变），外观是为了让**复杂的接口变简单**（面向多个子系统、主动设计出更友好的形状）。

**常见误解**：以为外观就是「上帝对象」的开始。只要外观保持「只做编排、不含业务规则」，它就是清晰的分层边界；一旦业务逻辑开始往里堆，才会退化成上帝对象。

也见 [Adapter（适配器模式）](#adapter适配器模式)、[Mediator（中介者模式）](#mediator中介者模式)、[Layered Architecture（分层架构）](#layered-architecture分层架构)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)

### Composite（组合模式）

组合模式把对象组织成**树形结构**，并让「单个叶子」和「一组对象」拥有**同一个接口**，于是调用方可以对整棵树写同一份递归代码：`node.render()` 对文件是画一个文件，对文件夹是遍历子节点各画一次。它适用于任何「整体—部分」的层次结构：文件系统、UI 组件树、菜单、组织架构。关键细节：接口必须刻意保持**对叶子与容器都合理**（如果容器有 `add()` 而叶子没有，就破坏了统一性，通常做法是叶子上的 `add()` 空实现或抛错并明确约定）；递归带来的深度问题与遍历顺序问题需要在实现时考虑。

**常见误解**：以为组合模式只是「树的递归遍历」。关键差别在**统一接口**——如果调用方需要 `if (是文件夹) ... else ...` 来区分类型，那就没得到组合模式的收益。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Visitor（访问者模式）](#visitor访问者模式)、[Command（命令模式）](#command命令模式)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)

### Flyweight（享元模式）

享元模式通过**共享大量细粒度对象的「不变部分」**来降低内存占用：把对象拆成「内在状态」（可共享、只读，如字符的字体与字号）与「外在状态」（每次使用各不相同，由调用方传入，如字符在文中的位置）。文本编辑器是经典例子——如果每个字符都建一个对象并各自存字体信息，内存会爆掉；共享字体对象后，内存只与「不同字体的数量」相关。关键细节：享元的本质是**用时间换空间**（每次使用都要查表取共享实例并传入外在状态），并且要求共享对象**严格不可变**——一旦有人修改了共享实例，所有使用者都会受影响。JS 里字符串驻留、`Map` 缓存池、对象池都是它的体现。

**常见误解**：以为享元就是「加个缓存」。缓存关心的是「避免重复计算」，享元关心的是「避免重复存储」，优化目标不同。

也见 [Singleton（单例模式）](#singleton单例模式)、[Memoization（记忆化）](#memoization记忆化)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)

### Mediator（中介者模式）

中介者模式引入一个**中心对象来协调多个同事对象之间的通信**，让同事之间不再互相持有引用，而是都只跟中介者说话。它把 N 个对象之间可能存在的 N² 条两两关系收敛为 N 条「对象到中介者」的关系。典型场景是 UI 表单里多个控件互相影响（勾选 A 则禁用 B、清空 C），或者聊天室里的消息分发。关键细节：中介者与发布订阅很像（都有中间层），区别在于**知晓程度与职责**——中介者通常**知道**所有同事是谁并包含具体的协调规则（是业务逻辑的集中地），而事件总线只是按名字转发、对订阅者一无所知；中介者的风险也在于此：协调规则不断加入会把中介者变成难以维护的「上帝对象」。

**常见误解**：以为中介者模式能让耦合消失。耦合并没有消失，只是从「网状」变成了「星形」——好处是它变得可见、可控，代价是中介者本身可能成为新的瓶颈。

也见 [Publish/Subscribe（发布订阅模式）](#publishsubscribe发布订阅模式)、[Observer（观察者模式）](#observer观察者模式)、[Facade（外观模式）](#facade外观模式)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Memento（备忘录模式）

备忘录模式**在不破坏封装的前提下捕获对象的内部状态，以便日后恢复**。它由三个角色组成：**发起人**（拥有状态的对象）、**备忘录**（状态的快照，对外不透明）、**管理者**（保管快照，但不窥探内容）。它是撤销/重做、事务回滚、编辑草稿的技术基础。关键细节：快照必须是**深拷贝或不可变数据**——如果备忘录里存的是原对象的引用，后续修改会连快照一起改掉，撤销时就只能恢复出「当前状态」；同时要管理**快照数量**，无限保存历史是内存泄漏的常见来源（实践中用环形缓冲或只保留最近 N 步）。

**常见误解**：把备忘录与命令模式的 `undo` 混为一谈。命令模式记录的是「操作」（以及如何逆操作），备忘录记录的是「状态快照」；两者常配合使用，但一个存意图、一个存数据。

也见 [Command（命令模式）](#command命令模式)、[State（状态模式）](#state状态模式)、[Immutability（不可变数据）](#immutability不可变数据)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Visitor（访问者模式）

访问者模式把**「对一组对象做什么操作」从对象本身剥离出来**，放进独立的访问者对象里；对象只需提供一个 `accept(visitor)` 方法，把「自己是什么类型」告诉访问者，由访问者决定怎么处理。它解决的是「数据结构稳定、但需要不断新增操作」的场景——新增一种操作只需新增一个访问者，不必修改任何被访问的类。关键细节：代价是**双分派**带来的复杂度，以及「新增一种数据类型」时所有访问者都要改（所以它适用于「类型稳定、操作多变」，反过来就不合适）；在 JS 里因为可以直接遍历和判断类型，访问者模式的价值比静态类型语言小得多，通常只在需要把遍历与处理严格分离时才有意义。

**常见误解**：以为访问者模式是「遍历树的标准做法」。它解决的是操作与结构解耦，遍历只是它常出现的场合；单纯遍历用递归或迭代器更直接。

也见 [Composite（组合模式）](#composite组合模式)、[Strategy（策略模式）](#strategy策略模式)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Bridge（桥接模式）

桥接模式把**「抽象」与「实现」拆成两条独立的继承层次**，再用组合把它们连起来，从而让两者可以各自独立变化。经典例子是「遥控器 × 设备」：遥控器（抽象）可以有基础款与进阶款，设备（实现）可以有电视与音响，两者相乘才形成完整功能——若用继承表达就要写 2×2 个类，而桥接只要 2+2 个类加一个引用。关键细节：它与策略模式结构相似（都是「持有一个可变实现」），区别在**意图与维度**——策略模式是「替换一个算法」，桥接是「让两个维度正交演化」，防的是**类爆炸**；识别信号是「这个东西有两个独立变化的分类维度吗」。

**常见误解**：以为凡是「组合优于继承」的写法都叫桥接。桥接特指**为两个正交维度解耦**而做的层次拆分，只有一个维度的组合通常就是普通的委托或策略。

也见 [Strategy（策略模式）](#strategy策略模式)、[Adapter（适配器模式）](#adapter适配器模式)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### SOLID（SOLID 五原则）

SOLID 是五个面向对象设计原则的首字母缩写，由 Robert C. Martin 整理：**S**RP 单一职责、**O**CP 开闭原则、**L**SP 里氏替换、**I**SP 接口隔离、**D**IP 依赖倒置。它们共同的目标是让代码**对扩展开放、对修改封闭**，把「变化」限制在最小的范围内。关键细节：五条原则互相支撑而非彼此独立——比如遵循依赖倒置（依赖抽象）自然更容易做到开闭原则（只加新实现、不改旧代码）；同时它们都是**启发式而非定律**，过度遵循会产出大量只有一个实现的接口与层层转发，反而增加阅读成本。判断标准始终是「这样改完，以后的变化是不是更容易了」。

**常见误解**：把 SOLID 当作可以打勾的合规清单。它是解释「什么样的结构更耐改」的语言，不是必须逐条满足的规则。

也见 [Single Responsibility Principle（单一职责原则）](#single-responsibility-principle-srp单一职责原则)、[Open/Closed Principle（开闭原则）](#openclosed-principle-ocp开闭原则)、[Dependency Inversion Principle（依赖倒置原则）](#dependency-inversion-principle-dip依赖倒置原则)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Single Responsibility Principle / SRP（单一职责原则）

单一职责原则说「**一个模块应该只有一个引起它变化的原因**」。注意这里的「职责」不是「只做一件事」而是「**只对一类变化负责**」——一个类如果既管数据格式又管持久化又管 HTTP 响应，那么数据库换型、接口改版、字段改名三种互不相干的变化都会逼它修改。职责的边界通常可以用「谁在提需求」来划分：同一类需求方驱动的改动才属于同一个职责。关键细节：拆分不是越细越好，把「一件事」拆成五个类同样违反原则的精神（每个类都不完整，改一个功能要动五个文件）；判断信号是「改一个功能时是否需要同时在多处小改」与「两个不相关的需求是否总撞在同一个文件里」。

**常见误解**：以为 SRP 就是「一个函数只做一件事」。粒度不是重点，**变化的来源是否单一**才是。

也见 [SOLID（SOLID 五原则）](#solidsolid-五原则)、[Separation of Concerns（关注点分离）](#separation-of-concerns关注点分离)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Open/Closed Principle / OCP（开闭原则）

开闭原则说软件实体应当**对扩展开放、对修改封闭**：新增一种能力时，理想情况是「新增代码」而不是「修改既有代码」。它的现实意义在于——修改既有代码意味着重新测试既有行为、意味着可能弄坏已经工作的东西，而新增代码的影响面天然更小。落地手段是多态（新增子类/新实现）与注册表（把新实现注册进去，主流程不变）。关键细节：OCP 无法 100% 达成，因为总要有第一处改动的入口（注册点本身要写）；它的目标是**把改动赶到一个可预测的位置**，而不是彻底消除修改。更要避免「为假想的未来扩展点提前抽象」——那正是过度设计。

**常见误解**：以为 OCP 要求任何改动都不能碰老代码。它约束的是「新增能力」这一维度，修 bug 与内部重构当然要改老代码。

也见 [Strategy（策略模式）](#strategy策略模式)、[SOLID（SOLID 五原则）](#solidsolid-五原则)、[Over-engineering（过度设计）](#over-engineering过度设计)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Liskov Substitution Principle / LSP（里氏替换原则）

里氏替换原则要求**子类型必须能够替换掉父类型而不破坏程序的正确性**：凡是父类能出现的地方，换成一个子类实例，程序行为应当依然符合预期。它约束的是**契约**而不是语法——子类可以做得更多，但不能要求更多（不能收紧前置条件）也不能承诺更少（不能放宽后置条件）。反面例子是经典的「正方形继承矩形」：矩形允许自由改宽高，正方形为了不变形必须让改宽同时改高，于是「把宽设为 5 再读高」在父类语境下期望得到原值，在子类下却变了——客户代码被破坏。关键细节：违反 LSP 的常见信号是 `if (obj instanceof Sub)` 或子类方法直接 `throw new Error('不支持')`。

**常见误解**：以为 LSP 只关乎继承。只要存在「接口契约 + 多个实现」，任何实现只要违背契约（比如更严格的参数要求、更弱的返回值保证）就违反了 LSP。

也见 [SOLID（SOLID 五原则）](#solidsolid-五原则)、[Interface Segregation Principle（接口隔离原则）](#interface-segregation-principle-isp接口隔离原则)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Interface Segregation Principle / ISP（接口隔离原则）

接口隔离原则说「**不应该强迫使用者依赖它用不到的方法**」，主张把胖接口拆成若干**按使用者需求划分**的小接口。它的洞察在于：接口不是按「实现方有什么」来切，而是按「调用方要什么」来切——一个 `Worker` 接口里同时有 `work()` 和 `eat()`，对机器人实现来说 `eat()` 就是必须写个空实现或抛错的负担，而且一旦 `eat()` 的签名变了，机器人也要跟着改。关键细节：在 JS 这种没有显式 `interface` 的语言里，ISP 体现为「传进来的依赖只要求它用到的那几个方法」——例如函数只调用 `logger.info` 就不要要求传一个完整的 logger 对象，鸭子类型让「小接口」实现起来非常自然。

**常见误解**：以为 ISP 只是「接口拆得越细越好」。拆分的依据是**使用者的实际需要**，与使用者无关的拆分只是制造碎片。

也见 [Liskov Substitution Principle（里氏替换原则）](#liskov-substitution-principle-lsp里氏替换原则)、[SOLID（SOLID 五原则）](#solidsolid-五原则)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Dependency Inversion Principle / DIP（依赖倒置原则）

依赖倒置原则有两条：**高层模块不应依赖低层模块，二者都应依赖抽象**；**抽象不应依赖细节，细节应依赖抽象**。所谓「倒置」，指的是把传统上「业务逻辑直接调用数据库」的依赖箭头翻过来——业务逻辑定义自己需要的接口（`UserRepository`），数据库实现去满足它，于是依赖方向从「业务 → 数据库」变成「两边 → 接口」。收益非常具体：换存储不影响业务代码，测试时注入内存实现即可，业务逻辑可以在任何环境下被验证。关键细节：抽象应当由**使用方**定义（调用者需要什么就声明什么），而不是由实现方把自己的一堆方法暴露出一个「接口」。

**常见误解**：把 DIP 等同于依赖注入。DIP 是**原则**（依赖谁、依赖什么形状），DI 是**手段**（怎么把依赖交进来）；不用任何框架，只要让业务函数接收一个符合自己定义的约口的对象，就已经在遵循 DIP。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Inversion of Control / IoC（控制反转）](#inversion-of-control-ioc控制反转)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Dependency Injection / DI（依赖注入）

依赖注入是一种**「不要在内部自己造依赖，而是从外部接收依赖」**的写法：需要数据库就要求传入一个 `db`，需要日志器就要求传入一个 `logger`，而不是在函数体里 `import` 一个具体实现或 `new` 一个具体类。它带来三个可量化的好处：**可测试**（测试传 fake 即可，无需打补丁）、**可替换**（换实现只改装配处）、**依赖显式**（看函数签名就知道它需要什么）。注入方式有构造函数注入、函数参数注入、属性注入三种，实践中以构造函数与函数参数最为常见。关键细节：注入的应当是**抽象**（约定好的方法集合）而非具体类；DI 框架（自动装配容器）只在依赖图很大时才有价值，小型项目手工传参更清晰可控。

**常见误解**：以为 DI 必须引入框架、必须写接口。在 JS 里「把依赖当参数传进去」就是依赖注入——本仓库的所有示例都是手写注入，没有容器。

也见 [Dependency Inversion Principle / DIP（依赖倒置原则）](#dependency-inversion-principle-dip依赖倒置原则)、[Inversion of Control / IoC（控制反转）](#inversion-of-control-ioc控制反转)、[Test Dependency Injection（测试中的依赖注入）](#test-dependency-injection测试中的依赖注入)。

示例：[`30_design_patterns/19_dependency_injection.js`](30_design_patterns/19_dependency_injection.js)

### Inversion of Control / IoC（控制反转）

控制反转是一个**更上位的原则**：把「程序流程由谁掌控」这件事翻转过来——传统模式下是你的代码主动调用库（你控制流程），反转之后是框架在合适的时机调用你的代码（框架控制流程）。回调、事件监听、钩子函数、依赖注入容器都是 IoC 的具体形式，因此常被概括成「**好莱坞原则：别打给我们，我们会打给你**」。关键细节：IoC 是**设计思想**，DI 是它在「依赖获取」这个维度上的实现手段（也是目前最常被混用的一对词）；框架用 IoC 换来的是「统管生命周期与流程」的权力，代价是你的代码必须遵循它的约定。

**常见误解**：把 IoC 和 DI 当同义词。DI 是 IoC 的一种实现，但 IoC 还包括事件驱动、模板方法、生命周期钩子等一大批「由框架调用你」的机制。

也见 [Dependency Injection / DI（依赖注入）](#dependency-injection-di依赖注入)、[Template Method（模板方法模式）](#template-method模板方法模式)。

示例：[`30_design_patterns/19_dependency_injection.js`](30_design_patterns/19_dependency_injection.js)

### Separation of Concerns（关注点分离）

关注点分离主张把**不同性质的问题**分开处理：数据获取与渲染分开、业务规则与传输格式分开、日志与算法分开。每个模块只解决一类问题，于是它可以被独立理解、独立测试、独立替换。它是几乎所有架构原则的共同祖先——分层架构、单一职责、MVC、DI 都在不同粒度上执行这一条。关键细节：关注点分离的判据是「**变化的节奏是否一致**」：两类东西是否总是一起改（那就该放一起），还是各改各的（那就该分开）；分离的代价是引入了边界与跳转，过度分离会让「看懂一个功能要跳八个文件」。

**常见误解**：以为分离就是按技术类型分文件夹（`controllers/`、`services/`、`utils/`）。真正的分离依据是**职责与变化原因**，按技术类型切分常常产生一堆没有内聚力的空壳层。

也见 [Single Responsibility Principle / SRP（单一职责原则）](#single-responsibility-principle-srp单一职责原则)、[Layered Architecture（分层架构）](#layered-architecture分层架构)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### Layered Architecture（分层架构）

分层架构把系统按**抽象层次**切成若干水平层（典型是表现层、业务逻辑层、数据访问层），约定访问规则：上层可以调用下层，下层不知道上层的存在，跨层调用通常被禁止。它让每层可以独立替换（换数据库只动数据层），也让「这段代码该放哪」有了默认答案。关键细节：分层的成本是**穿透调用**——一个简单查询也要穿过三层，因此常配合「层内可以跳过无价值的中转」的务实规则；分层的边界也可以按需减少（小项目两层足够），关键不是层数而是**依赖方向单向且稳定**。本仓库的数据访问示例正是「路由层 → 服务/仓储层 → 数据库」的三层落地。

**常见误解**：以为分层就是把文件夹分成三个。真正的分层约束的是**依赖方向**，如果数据层反过来 import 了路由层（比如为了抛 HTTP 错误），层次就已经不存在了。

也见 [Separation of Concerns（关注点分离）](#separation-of-concerns关注点分离)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### MVC（Model-View-Controller）

MVC 把界面程序切成三个角色：**Model** 持有数据与业务规则，**View** 负责把数据呈现出来，**Controller** 接收用户输入、更新 Model 并选择 View。它是最早的 GUI 架构模式之一，核心贡献是把「数据」与「呈现」解耦，让同一份数据可以有不同的展示。关键细节：MVC 在不同平台上的实际形态差别很大——服务端 MVC 里 Controller 通常返回一个渲染好的视图，浏览器端则演化出了多种变体；而且 MVC 并没有规定 Model 与 View 之间是否直接通信，这个含糊之处正是后来 MVVM、Flux 等模式试图解决的问题。

**常见误解**：以为「三层架构」就是 MVC。分层架构说的是**纵向的依赖层次**（表现/业务/数据），MVC 说的是**同一层内部的角色分工**，两者可以同时存在。

也见 [MVVM（Model-View-ViewModel）](#mvvmmodel-view-viewmodel)、[Separation of Concerns（关注点分离）](#separation-of-concerns关注点分离)、[Observer（观察者模式）](#observer观察者模式)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### MVVM（Model-View-ViewModel）

MVVM 在 MVC 的基础上引入 **ViewModel**：它把 Model 的数据转换成 View 可以直接绑定的形状（格式化、派生、校验状态），并通过**双向数据绑定**让「View 改动自动写回 ViewModel、ViewModel 改动自动刷新 View」。这样 View 里几乎不需要命令式代码，业务逻辑集中在 ViewModel 里可被独立测试。关键细节：双向绑定是 MVVM 的标志也是它的代价——数据流向变得不直观，调试时要靠工具追踪「这次更新是谁触发的」；这也是 React 系生态更倾向**单向数据流**（Flux/Redux）的原因。它与 MVC 的差别可概括为：MVC 的 Controller 处理「动作」，MVVM 的 ViewModel 持有「状态」。

**常见误解**：以为 MVVM 是 MVC 的升级版。二者是并列的架构选择，取舍在于「双向绑定带来的开发效率」是否值得「数据流可预测性的下降」。

也见 [MVC（Model-View-Controller）](#mvcmodel-view-controller)、[Observer（观察者模式）](#observer观察者模式)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### DTO（数据传输对象，Data Transfer Object）

DTO 是**专门用于在层与层、进程与进程之间搬运数据的简单对象**，它没有行为，只有字段：`{ id, name, email }`。它存在的理由是「**不要把你的内部表示直接暴露出去**」——数据库实体可能有密码哈希、内部状态、懒加载关联，直接序列化给客户端既泄漏信息又把内部结构变成了公共契约（以后想重命名字段就是破坏性变更）。关键细节：DTO 应当**按消费者需要塑形**而不是照抄数据库行（对外接口里出现 `password_hash` 字段通常说明缺了 DTO）；从实体到 DTO 的转换（mapper）是一处显式边界，也是唯一需要维护映射的地方。在小项目里 DTO 可能显得多余，但一旦接口有外部使用者，它就是最低成本的信息隐藏手段。

**常见误解**：以为 DTO 只是「再多建一个类」。它不是形式主义——不建 DTO 就意味着你的数据库 schema 同时是对外 API 契约，两者被永久绑定。

也见 [Layered Architecture（分层架构）](#layered-architecture分层架构)、[Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）](#sensitive-data-exposure-log-redaction敏感信息泄漏与日志脱敏)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### Anti-pattern（反模式）

反模式是**看起来像解法、实际上会带来更多问题的常见做法**，描述形式与设计模式相同（问题—诱人的方案—后果—替代方案），只是记录的是失败经验。它的价值在于「**给坏味道起名字**」：一旦团队能给「上帝对象」「意大利面条代码」「金锤子（手里有锤子看什么都像钉子）」「复制粘贴编程」「过早优化」命名，就能在评审中快速达成共识。关键细节：反模式之所以流行，通常因为它在**短期内确实有效**（复制粘贴最快、全局变量最省事），代价要到规模变大后才显现——这正是它难以劝阻的原因，也因此描述「未来的代价」比描述「当下不好看」更有说服力。

**常见误解**：以为「反模式」等于「绝对不会用的写法」。它描述的是「在错误场景下使用」，比如单例在配置对象上合理，在业务状态上就是反模式。

也见 [Over-engineering（过度设计）](#over-engineering过度设计)、[Design Pattern（设计模式）](#design-pattern设计模式)、[DRY（DRY 原则）](#dry不要重复自己dont-repeat-yourself)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### Over-engineering（过度设计）

过度设计指**为并不存在的需求增加复杂度**：为只有一个实现的功能抽出接口，为可能永远不会有的第二种数据库加一层抽象，为「以后可能要扩展」而引入模式与配置。它的危害是真实的——多出来的每一层抽象都要读、要维护、要跟着重构，而它带来的灵活性可能永远用不上；更糟的是，错误的抽象比没有抽象更难拆除，因为已有代码已经依赖它了。关键细节：判断依据是**已知需求而非假想需求**——「我们下个季度确实要接第二种支付」是需求，「说不定以后要支持别的」是想象；应对方法是「先写最直接的实现，等第二次真的出现重复或变化时再抽象」（Rule of Three，三次法则）。

**常见误解**：以为「过度设计」和「好的设计」界限模糊所以不必在意。它其实有明确信号：**抽象的使用者只有一处**、**接口的方法只有一个实现且看不到第二种**、**配置文件里全是从未被改过的开关**。

也见 [YAGNI](#yagni你不会需要它you-arent-gonna-need-it)、[Anti-pattern（反模式）](#anti-pattern反模式)、[Open/Closed Principle / OCP（开闭原则）](#openclosed-principle-ocp开闭原则)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### YAGNI（你不会需要它，You Aren't Gonna Need It）

YAGNI 是极限编程提出的一条原则：**不要实现「现在不需要、将来可能需要」的功能**。理由不是懒惰，而是**预期几乎总是错的**——你花两周做的可扩展点，很可能因为需求变化而完全用不上，而这两周里你还顺带引入了额外的复杂度、更多的代码路径和更多的测试负担。关键细节：YAGNI 常被误读成「禁止任何前瞻」，但它其实要求的是「**先做最简单能用的版本，让真实需求来驱动下一步**」；它和「重构」是一对——正因为留了简单清晰的代码，将来真需要时重构的代价才低。它反对的是提前建抽象，而不是反对思考和留有余地。

**常见误解**：把 YAGNI 当作拒绝写测试或拒绝处理错误的借口。错误处理与测试对**当前功能**是必要的，不属于「将来可能需要」。

也见 [Over-engineering（过度设计）](#over-engineering过度设计)、[KISS（KISS 原则）](#kiss保持简单keep-it-simple-stupid)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### KISS（保持简单，Keep It Simple, Stupid）

KISS 主张**在能满足需求的前提下选最简单的方案**。它的依据很实在：复杂度是 bug 的温床（分支越多、状态越多，组合爆炸越厉害），也是理解成本的来源（同事读 20 行直白代码花 10 秒，读 5 层抽象的 200 行花 10 分钟）。关键细节：KISS 与「写得粗糙」不同——简单指**结构简单、概念少**，而不是「不管边界情况、不写错误处理」；恰恰相反，把边界情况处理干净往往能让主流程更简单。它与 YAGNI、DRY 构成一组制衡：DRY 要求消除重复（引入抽象），KISS 与 YAGNI 则提醒抽象本身有成本，三者需要一起权衡而不是各自走到极端。

**常见误解**：以为「简单」等于「短」。把三个函数压成一行嵌套三元表达式只是更短，不是更简单。

也见 [DRY（DRY 原则）](#dry不要重复自己dont-repeat-yourself)、[YAGNI](#yagni你不会需要它you-arent-gonna-need-it)、[Over-engineering（过度设计）](#over-engineering过度设计)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### DRY（不要重复自己，Don't Repeat Yourself）

DRY 的准确表述是「**每一处知识都应当在整个系统中只有一个权威的、无歧义的表示**」。它的关键词是**知识**而不是「代码文本」——两段长得一样的代码如果表达的是不同的业务规则，它们的「巧合重复」不违反 DRY，也不该被强行合并。违反 DRY 的代价是「改一处忘一处」：业务规则改了三个地方漏了一个，就是线上 bug。关键细节：滥用 DRY 是过度设计最常见的来源——为了消除三行相似代码而造一个带六个参数的通用函数，结果每次调用都要读半天文档，这属于把重复换成了抽象复杂度。判别标准是「**它们会一起变化吗**」（会，则合并；不会，则保持分开，哪怕今天看起来一样）。

**常见误解**：把 DRY 当成「不许出现重复代码」。复制粘贴两次以等待第三次出现（三次法则），往往比立刻抽象更明智。

也见 [KISS（KISS 原则）](#kiss保持简单keep-it-simple-stupid)、[Over-engineering（过度设计）](#over-engineering过度设计)、[Anti-pattern（反模式）](#anti-pattern反模式)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

## 性能与内存

### Profiling（性能剖析）

性能剖析是**用测量代替猜测**来定位性能瓶颈的过程：先让程序跑起来并采集数据（函数调用耗时、内存分配、事件循环阻塞），再从数据里找出真正的热点。它之所以不可省略，是因为**直觉在性能问题上极不可靠**——开发者猜的瓶颈往往与实际相差一个数量级，而优化一个不是瓶颈的地方收益为零。关键细节：剖析必须在**接近真实的数据规模与运行环境**下进行（用 10 条数据测排序毫无意义），且要先定义指标（延迟、吞吐、内存峰值）再采集；采样式剖析器开销小、适合生产，插桩式更精确、适合本地；在 Node 里可以用 `--prof`、`perf_hooks` 与 inspector，在浏览器里用 Performance 面板。

**常见误解**：以为「看一眼代码就知道哪里慢」。真正耗时往往在你不曾怀疑的地方（序列化、正则回溯、意外的 N+1 查询、布局重排）。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Heap Snapshot（堆快照）](#heap-snapshot堆快照)、[Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)。

示例：[`31_performance_and_memory/13_memory_profiling.js`](31_performance_and_memory/13_memory_profiling.js)

### Benchmark（基准测试）

基准测试是在**受控条件下重复运行同一段代码并测量其耗时**，用来比较两种实现或验证优化效果。它比「随手 `console.time` 一次」严格得多：需要预热、多轮采样、取统计量（中位数等）并关注离散程度。关键细节：JS 基准测试有三个经典陷阱——**预热不足**（前几轮被解释执行或基线编译，后面才走 JIT 优化后的代码，混在一起平均毫无意义）、**死代码消除**（结果没被使用的计算可能被引擎整段删掉，于是「快」得离谱，需要把结果消费掉）、以及**微基准与真实场景脱节**（测出的结论只能在它测的那个条件下成立）。所以结论要配合真实剖析验证。

**常见误解**：以为「跑一次 0.5ms」是可靠数据。单次测量几乎必然被 GC、JIT 与系统调度干扰，中位数与足够的样本量才是可比较的基础。

也见 [Warmup（预热）](#warmup预热)、[Profiling（性能剖析）](#profiling性能剖析)、[Big O（大 O 表示法）](#big-o大-o-表示法)。

示例：[`31_performance_and_memory/11_benchmark_basics.js`](31_performance_and_memory/11_benchmark_basics.js)

### Warmup（预热）

预热指在正式测量前**先空跑若干轮**，让引擎有机会把热点函数编译成优化后的机器码、让内联缓存稳定下来、让懒初始化的结构就位。不预热时，前几轮测到的是「解释执行 + 首次编译」的开销，会把慢实现的差距掩盖、或让快实现看起来忽快忽慢。关键细节：预热轮数取决于函数复杂度与引擎策略，实践中常先跑几千到几万次再开始计时；预热还有一个副作用值得警惕——**它可能掩盖真实的首次调用成本**，如果你的场景是「冷启动只跑一次」，那么冷态数据才是你要的，此时不该预热。

**常见误解**：以为预热只是「让缓存热起来」。它主要影响的是**JIT 编译层级与内联缓存的成熟度**，这两者会改变代码的执行路径本身。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Inline Cache（内联缓存）](#inline-cache内联缓存)。

示例：[`31_performance_and_memory/11_benchmark_basics.js`](31_performance_and_memory/11_benchmark_basics.js)

### Dead Code Elimination（死代码消除）

死代码消除指编译器/引擎**把结果从未被使用、且没有副作用可观察的计算整段删掉**。它本是好事，但在做性能测试时会造成荒谬结果：如果基准测试里算了 `sum` 却从不打印也不返回，引擎可能直接把整个循环优化掉，于是「一百亿次加法」耗时 0 毫秒。关键细节：防御办法是**消费结果**——把它累加进一个在循环外声明、最后 `console.log` 或返回的变量，或者用 `globalThis` 赋值让引擎无法证明它不可观察；同理，`typeof x` 这类「看起来有副作用」的调用不能随便拿来当消费手段，因为引擎清楚它无副作用。

**常见误解**：把「我的优化让代码快了 100 倍」当真。先检查代码是不是被整段删掉了——基准测试异常漂亮的结果十有八九来源于此。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Warmup（预热）](#warmup预热)。

示例：[`31_performance_and_memory/11_benchmark_basics.js`](31_performance_and_memory/11_benchmark_basics.js)

### Big O（大 O 表示法）

大 O 描述**算法耗时（或空间）随输入规模增长的趋势**，忽略常数与低阶项：`O(1)` 不随规模变化，`O(log n)` 对数增长，`O(n)` 线性，`O(n log n)` 常见于高效排序，`O(n²)` 是嵌套循环的典型信号。它关心的不是「小数据下谁快」而是「数据变大后会怎样」——`O(n²)` 在 100 条时可能比 `O(n log n)` 还快（常数更小），在 100 万条时则慢到不可用。关键细节：大 O 只描述**主项的增长**，因此常数因子极其重要（同一个 `O(n)` 的两个实现可能差 10 倍）；分析时要注意**隐式复杂度**——`arr.includes()` 是 `O(n)`、`arr.shift()` 也可能是 `O(n)`、对象属性访问在大 O 记法里写 `O(1)` 但实际上依赖 V8 的隐藏类优化。

**常见误解**：以为「复杂度低就一定更快」，于是在只看得到几十个元素的地方把可读的数组换成 Set；也见本仓库对「小数据下大 O 无意义」的实测。

也见 [Profiling（性能剖析）](#profiling性能剖析)、[Benchmark（基准测试）](#benchmark基准测试)、[Memoization（记忆化）](#memoization记忆化)。

示例：[`31_performance_and_memory/04_algorithm_complexity.js`](31_performance_and_memory/04_algorithm_complexity.js)

### Debounce（防抖）

防抖让函数在**停止被触发一段时间之后才真正执行一次**：事件每来一次就重置计时器，只有安静满 `delay` 毫秒才落地。典型用途是搜索框输入（用户还在打字时不必发请求）、窗口 resize 结束时重算布局、表单校验。关键细节：实现要点是用闭包保存 `timer`，每次调用 `clearTimeout` 再 `setTimeout`；通常还要支持 `cancel()`（组件卸载时必须取消，否则泄漏）、`leading`（首次立即执行，用于按钮防连点）与 `maxWait`（防止持续触发导致永不执行）。它与节流的区别见下一条。

**常见误解**：以为防抖会让「所有调用被合并成一次」。合并的是**连续期间的多次触发**，如果两次触发之间间隔超过 `delay`，它们仍会各自执行一次。

也见 [Throttle（节流）](#throttle节流)、[Race Condition（竞态条件）](#race-condition竞态条件)、[Memoization（记忆化）](#memoization记忆化)。

示例：[`31_performance_and_memory/01_debounce.js`](31_performance_and_memory/01_debounce.js)

### Throttle（节流）

节流让函数在**一段时间内最多执行一次**：无论事件触发多密集，执行频率被限制在 `delay` 毫秒一次，中间多余的触发被丢弃或延后。它适用于「过程中就要持续反馈」的场景——滚动位置更新、鼠标移动绘制、拖拽时的坐标上报、滚动加载。关键细节：常见三种实现——时间戳版（首次立即执行，最后一次可能丢失）、定时器版（首次延迟执行，末次会补上）、以及结合版（首次立即 + 末尾补执行，最符合直觉）；`leading`/`trailing` 两个开关决定了「第一次要不要马上执行」与「结束后要不要补一次」。

**常见误解**：把节流和防抖混用。一句话区分：**防抖是「等你停下来再做」，节流是「我按固定节奏做」**。搜索建议用防抖（不需要中间态），滚动进度条用节流（需要连续反馈）。

也见 [Debounce（防抖）](#debounce防抖)、[Long Task（长任务）](#long-task长任务)。

示例：[`31_performance_and_memory/02_throttle.js`](31_performance_and_memory/02_throttle.js)

### Memoization（记忆化）

记忆化是**缓存函数的计算结果、用入参作为键，下次相同输入直接返回缓存**的优化手段，本质上是「用内存换时间」。它成立的三个前提是：函数是**纯函数**（同输入必同输出、无副作用）、**入参可被稳定地序列化成键**、以及**重复调用足够频繁**（否则缓存只增内存不省时间）。关键细节：键的构造是最大的坑——对象参数直接当键会失效（每个字面量都是新引用），用 `JSON.stringify` 又会因键顺序不同而产生重复项，且无法处理 `undefined`/函数/循环引用；实践中常用「首个参数为原始值 + 单键 Map」或自定义 `resolver`。还要考虑淘汰策略（LRU）与失效（TTL、外部状态变化时手动清空），否则缓存会变成内存泄漏源。

**常见误解**：以为记忆化是「无脑加速」。对不纯的函数（依赖时间、随机数、外部状态）做记忆化会产生**错误的返回值**，比慢更糟。

也见 [Flyweight（享元模式）](#flyweight享元模式)、[Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Debounce（防抖）](#debounce防抖)。

示例：[`31_performance_and_memory/03_memoization.js`](31_performance_and_memory/03_memoization.js)

### Race Condition（竞态条件）

竞态条件指**多个异步操作的执行顺序不确定**，导致结果依赖于「谁先完成」而产生的不确定性缺陷。最典型的场景是两次并发请求返回顺序颠倒：用户先搜「ab」再搜「abc」，结果「ab」的响应后到，界面显示的是过期结果。JS 虽然是单线程，但异步任务交织同样会造成竞态——这与多线程里的数据竞争（data race）不是一回事，`await` 之间任何时刻都可能插入其它任务。常见解法是给请求编号只采纳最新一次、用 `AbortController` 取消过期请求、或者用防抖合并高频触发。

**常见误解**：以为「JS 单线程所以没有竞态」。单线程只保证「同一时刻只有一段代码在跑」，不保证「多个异步操作的先后关系符合你的假设」。

也见 [Debounce（防抖）](#debounce防抖)、[Idempotency（幂等性）](#idempotency幂等性)、[Testing Async Code（异步代码测试）](#testing-async-code异步代码测试)。

示例：[`31_performance_and_memory/01_debounce.js`](31_performance_and_memory/01_debounce.js)、[`28_testing/06_testing_async_code.js`](28_testing/06_testing_async_code.js)

### Object Shape / Hidden Class（对象形状与隐藏类）

隐藏类（V8 的叫法，SpiderMonkey 叫 shape）是引擎为**每个具有相同属性布局的对象**建立的一份内部描述：属性的名字、顺序、类型与内存偏移。同一份构造函数创建的对象共享同一个隐藏类，于是属性访问能被优化成「基址 + 固定偏移」的一次内存读取，几乎和访问数组元素一样快。关键细节：一旦对象的**属性被增删、或顺序不同、或类型改变**，隐藏类就会迁移或重建，属性访问退化成哈希查找，性能可能相差一个数量级；因此最佳实践是「构造函数里一次声明全部属性、按相同顺序赋初值、不要用 `delete`（会创建新的隐藏类并让对象变成字典模式）」。

**常见误解**：以为这只是引擎内部细节、写代码时无所谓。对热路径上执行百万次的对象操作来说，形状稳定与否是最容易获得的一笔性能收益。

也见 [Inline Cache（内联缓存）](#inline-cache内联缓存)、[Deoptimization（去优化）](#deoptimization去优化)。

示例：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Inline Cache（内联缓存）

内联缓存（IC）是引擎在**每个属性访问点**（如 `obj.x`）缓存「上次访问时对象的隐藏类是什么、`x` 在什么偏移」的机制。下次执行到这里时，如果隐藏类没变，就直接按缓存的偏移取值（单态命中，最快）；如果遇到了第二种形状，就退化为多态缓存（比较若干种形状）；形状太多则变成超多态（megamorphic），退化成哈希查找。关键细节：IC 是**按代码位置**而不是按对象生效的，所以「同一个函数被喂了多种形状的对象」会让该访问点变多态——这就是为什么给同一个函数传不同结构的对象集合会明显变慢；保持调用点的形状单态是引擎优化中最实用的一条建议。

**常见误解**：以为「JS 属性访问都是 O(1)」所以无所谓。它在大 O 意义上是常数，但常数因子可以差十倍以上。

也见 [Object Shape / Hidden Class（对象形状与隐藏类）](#object-shape-hidden-class对象形状与隐藏类)、[Deoptimization（去优化）](#deoptimization去优化)。

示例：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Deoptimization（去优化）

去优化是引擎在**优化编译时所做的假设被打破**后，把已经优化过的代码**回退到未优化版本**继续执行的过程。V8 的优化编译器会根据运行时观察做出激进假设（「这里收到的总是数字」「这个对象的形状总是 X」「这个函数从不被重新赋值」），一旦假设失效就必须「脱下优化外套」重来。常见触发原因：类型混用（`number` 的累加器里突然出现字符串）、给对象增删属性、对函数声明后重新赋值、超过参数个数上限、`try/catch` 或 `with` 让变量作用域无法静态确定、以及 `arguments` 的滥用。关键细节：单次去优化代价不大，但**反复优化又反复去优化**（optimize-deopt 循环）会让热路径比从不优化还慢。

**常见误解**：以为「优化过的代码会一直保持优化」。优化是基于**观察到的历史**做的投机，历史变了结论就要撤回。

也见 [Inline Cache（内联缓存）](#inline-cache内联缓存)、[Object Shape / Hidden Class（对象形状与隐藏类）](#object-shape-hidden-class对象形状与隐藏类)。

示例：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Garbage Collection / GC（垃圾回收）

垃圾回收是运行时**自动回收不再被使用的内存**的机制，让开发者不必手工释放内存。它判断「不再使用」的依据不是「作用域结束了没有」，而是**可达性**：从根集合（全局对象、当前调用栈上的局部变量、闭包引用等）出发能走到的对象就是活的，走不到的就是垃圾。关键细节：GC 是**非确定性的**——你无法知道它何时运行、一次回收多少，因此不能依赖它做资源管理（文件句柄、网络连接必须显式释放）；同时 GC 会**暂停执行**（stop-the-world），虽然现代引擎已把大部分工作并发化，但在分配速率极高的场景下 GC 停顿仍会造成可感知的卡顿，减少短命对象的分配往往比「优化算法」更有效。

**常见误解**：以为「有 GC 就不会内存泄漏」。只要还有一条从根可达的引用链指向不再需要的对象（比如数组里忘了移除的监听器），GC 就无法回收它。

也见 [Reachability（可达性）](#reachability可达性)、[Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Generational GC（分代回收）](#generational-gc分代回收)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Generational GC（分代回收）

分代回收基于「**分代假设**」：绝大多数对象**朝生夕死**（临时字符串、中间结果），而少数对象会存活很久（配置、缓存、长生命周期服务）。既然两类的生命周期特征截然不同，就分而治之——**新生代**用便宜的算法频繁回收，**老生代**用昂贵的算法低频回收。关键细节：分代带来一个必要的机制——**写屏障与记忆集**，因为回收新生代时需要知道「老生代对象是否引用了新生代对象」（否则会误删活对象）；对象经过若干次新生代回收仍存活后会被**晋升（promote）**到老生代，而一次错误的晋升（比如一个大数组长期被引用）会让老生代膨胀、触发昂贵的大回收。

**常见误解**：以为分代是「按对象年龄排序的优化技巧」。它是对**真实分配模式**的统计规律的应用，这也是为什么「减少短命对象分配」对吞吐帮助最大。

也见 [Scavenge（新生代回收）](#scavenge新生代回收)、[Mark-and-Sweep（标记清除）](#mark-and-sweep标记清除)、[Garbage Collection / GC（垃圾回收）](#garbage-collection-gc垃圾回收)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Scavenge（新生代回收）

Scavenge 是 V8 回收**新生代**所用的算法：把新生代内存分成两块（`from`/`to`），回收时从根出发扫描存活对象，把它们**复制**到另一半空间并紧凑排列，然后整块丢弃原来那一半。它的两个优点都来自「复制」：回收成本只与**存活对象数量**成正比（而不是与总分配量成正比，因为死对象不需要逐个处理），而且复制天然完成了内存整理、没有碎片。关键细节：新生代的典型配置只有几 MB，「存活对象少」是它高效的前提，因此 `--max-semi-space-size` 调大反而可能让每次回收更慢；存活过两轮的对象会被晋升到老生代。

**常见误解**：以为 Scavenge 和标记清除是同一套算法的不同参数。它们思路完全不同——一个是「复制存活者」，一个是「标记垃圾」。

也见 [Generational GC（分代回收）](#generational-gc分代回收)、[Mark-and-Sweep（标记清除）](#mark-and-sweep标记清除)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Mark-and-Sweep（标记清除）

标记清除是回收**老生代**的基础算法，分两阶段：**标记**——从根集合出发遍历所有可达对象并打上标记；**清除**——扫描整片堆，把没有标记的对象的内存回收。它不移动存活对象，因此适合处理大对象与数量众多的存活对象；代价是会产生**内存碎片**，长期运行后可能出现「总空闲内存足够但没有一块连续的够大空间」的情况，为此 V8 还会做**标记整理（mark-compact）**——在标记之后把存活对象挪到一起。关键细节：标记阶段需要遍历整个对象图，所以成本与**堆中的对象总数**相关（即使其中绝大多数是垃圾），这正是「老生代回收比新生代慢得多」的原因。

**常见误解**：以为「清除」是立刻把内存还给操作系统。多数情况下内存只是回到引擎的空闲列表中以供后续分配复用，进程的 RSS 未必下降。

也见 [Scavenge（新生代回收）](#scavenge新生代回收)、[Retained Size（保留大小）](#retained-size保留大小)、[Heap Snapshot（堆快照）](#heap-snapshot堆快照)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Reachability（可达性）

可达性是 GC 判断「对象是否还有用」的唯一标准：**从根集合出发，沿引用链能走到的对象就是活的**。根集合包括全局对象、当前执行栈上的局部变量与参数、闭包捕获的变量、以及正在被 `WeakRef` 之外的方式持有的对象。这个定义解释了很多反直觉的现象——一个对象即使「业务上早就没用了」，只要还有一条引用链指向它（数组里的一项、闭包里的变量、事件监听器的回调捕获），GC 就绝不会回收它。关键细节：因此排查泄漏的思维方式是「**从根到该对象找出那条引用链**」，堆快照的「Retainers（保留者）」视图正是为此设计的。

**常见误解**：以为「离开作用域 = 立刻可回收」。作用域只是不再持有引用的一个原因，闭包、缓存表、未注销的监听器都可能让引用存活得远比你想的久。

也见 [Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Retained Size（保留大小）](#retained-size保留大小)、[Garbage Collection / GC（垃圾回收）](#garbage-collection-gc垃圾回收)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Memory Leak（内存泄漏）

内存泄漏指**不再需要的内存因为仍被引用而无法被回收**，表现为进程内存持续增长、GC 越来越频繁且停顿变长，最终 OOM 崩溃。JS 里最常见的五种模式是：意外的**全局变量**（漏写 `const` 或挂到 `globalThis`）、**未清理的定时器**（`setInterval` 的回调闭包一直持有外部状态）、**闭包持有大对象**（一个函数返回小闭包，却捕获了整个大数组）、**无上限的缓存或集合**（Map 只增不减、数组当队列只用 `push`）、以及**分离的 DOM 节点**（节点已从文档移除，但 JS 里还有引用，监听器也还在）。关键细节：防御手段除了逐个排查，还包括用 `WeakMap`/`WeakRef` 让缓存不阻止回收、为所有订阅与定时器配对 `off`/`clear`、以及给缓存设容量上限或 TTL。

**常见误解**：以为「内存上升就是泄漏」。内存占用随负载上升、GC 之后回落，是正常的；泄漏的特征是**在压力消失后内存不回落**，所以判断前要先触发一次 GC 并观察基线。

也见 [Reachability（可达性）](#reachability可达性)、[Heap Snapshot（堆快照）](#heap-snapshot堆快照)、[WeakRef / WeakMap（弱引用）](#weakref-weakmap弱引用)。

示例：[`31_performance_and_memory/09_memory_leak_patterns.js`](31_performance_and_memory/09_memory_leak_patterns.js)

### Heap Snapshot（堆快照）

堆快照是**把某一时刻堆上所有对象及其引用关系完整导出**的一份文件（Chrome DevTools 的 `.heapsnapshot`，Node 用 inspector 或 `v8.writeHeapSnapshot`）。分析的标准三步法是：**先触发 GC 再拍基线快照**，操作一段时间后**再拍第二张**，然后用 Comparison 视图按 `# Delta` 排序——**增长最快且数量持续增加的对象**就是嫌疑对象；接着用 Retainers 视图从该对象出发**反向查找「谁在引用它」**，一路走到根，那条链就是泄漏路径。关键细节：快照会暂停程序且文件可能几百 MB，因此尽量在能复现问题的环境下拍、并注意两次快照之间不要有无关操作干扰。

**常见误解**：以为「对象数量多就是泄漏」。数量多但稳定说明是正常缓存或数据结构；泄漏的判据是**两次快照之间持续净增长**且看不出合理的业务原因。

也见 [Retained Size（保留大小）](#retained-size保留大小)、[Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Profiling（性能剖析）](#profiling性能剖析)。

示例：[`31_performance_and_memory/13_memory_profiling.js`](31_performance_and_memory/13_memory_profiling.js)

### Retained Size（保留大小）

保留大小指「**该对象被回收后能一并释放的内存总量**」，也就是它独占支配（dominator）的所有对象的大小之和。它区别于 **Shallow Size（浅大小）**——后者只是对象自身占用的字节数（一个数组的浅大小可能只有几十字节，而它引用的十万个元素不算在内）。关键细节：排查泄漏时**看保留大小而不是浅大小**，因为真正的内存往往「挂」在一个小对象下面（一个 Map 的浅大小很小，但它保留了几百 MB 的值）；支配树的层级决定了「删掉哪个引用收益最大」——删掉支配树上位置最高的那个引用，就能一次性释放整棵子树。

**常见误解**：以为「这个对象只有 100 字节所以不是它」。100 字节的对象可能是几百 MB 数据的唯一入口，这正是必须看保留大小的原因。

也见 [Heap Snapshot（堆快照）](#heap-snapshot堆快照)、[Reachability（可达性）](#reachability可达性)。

示例：[`31_performance_and_memory/13_memory_profiling.js`](31_performance_and_memory/13_memory_profiling.js)

### WeakRef / WeakMap（弱引用）

弱引用是**不阻止 GC 回收对象**的引用：`WeakMap`/`WeakSet` 的键、以及 `WeakRef` 指向的目标，只要没有其它强引用存在，就可以被回收，而对应的缓存项会自动消失。这让「给对象附加缓存或元数据」不再构成泄漏——用普通 `Map` 做缓存，键对象被永久持有；换成 `WeakMap`，键被回收时条目自动清除。关键细节：`WeakMap` 的键必须是对象（原始值无法被弱持有），且**不可枚举**（正因为条目随时可能消失，遍历会得到不确定结果）；`WeakRef` 的 `deref()` 可能返回 `undefined`，配合 `FinalizationRegistry` 可以在回收后执行清理，但**回收时机不确定**，绝不能把「依赖清理必然发生」的逻辑建在上面。

**常见误解**：以为 `WeakMap` 是「性能更好的 Map」或「能遍历的缓存」。它唯一的语义价值是「不阻止回收」，也正因如此它不提供 `size` 与遍历。

也见 [Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Garbage Collection / GC（垃圾回收）](#garbage-collection-gc垃圾回收)。

示例：[`31_performance_and_memory/10_weakref_and_gc.js`](31_performance_and_memory/10_weakref_and_gc.js)

### Long Task（长任务）

长任务指**占用主线程连续超过 50 毫秒的任务**，这个阈值来自「人机交互的响应预算」——超过它，用户输入就无法在 100ms 内得到视觉反馈，表现为点击无反应、滚动卡顿、输入延迟。浏览器会把超过 50ms 的任务标记出来（PerformanceObserver 的 `longtask` 条目），它的时长直接关联 INP 指标。常见成因是一个大循环处理十万条数据、一次同步的大 JSON 解析、复杂的正则回溯、大量 DOM 操作、或一次同步的布局计算。关键细节：长任务的危害不仅是「慢」，更是**阻塞事件循环**——期间所有定时器、点击、渲染都被推迟；解法是拆分为多个小任务（时间切片）或挪到 Worker。

**常见误解**：以为「优化到 45ms 就安全了」。长任务频繁出现（哪怕每次 60ms）同样会造成持续的交互延迟，减少**总阻塞时间**比压低单次峰值更重要。

也见 [Time Slicing（时间切片）](#time-slicing时间切片)、[Yield to Main Thread（让出主线程）](#yield-to-main-thread让出主线程)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### Time Slicing（时间切片）

时间切片是把**一个长任务拆成多个不超过几十毫秒的小块**，每块之间让出主线程，使浏览器有机会处理输入与渲染。例如渲染一万条列表项时，不写 `for (一万次) render()`，而是每处理 100 条就 `await` 一次让出，让页面保持可交互。关键细节：切片的粒度是关键权衡——切得太碎会让总耗时因调度开销变长，切得太粗则达不到响应要求（一般每片控制在 5~50ms）；让出方式从「`setTimeout(0)`」演进到「`await new Promise(r => setTimeout(r))`」「`requestIdleCallback`」「`scheduler.yield()`」，后者能真正回到事件循环末尾而不是插队；同时切片会让**执行顺序不再连续**，必须处理「用户在此期间又触发了新操作」的情况。

**常见误解**：以为切片能让总工作量变少。总时间通常**变长**（多了调度开销），换来的是**交互响应性**，这是有意的取舍。

也见 [Long Task（长任务）](#long-task长任务)、[Yield to Main Thread（让出主线程）](#yield-to-main-thread让出主线程)、[Virtual List / Windowing（虚拟列表与窗口化）](#virtual-list-windowing虚拟列表与窗口化)。

示例：[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### Yield to Main Thread（让出主线程）

让出主线程指**主动结束当前任务、把控制权交还事件循环**，让排队的用户输入与渲染先得到处理。它是时间切片得以生效的机制，也是「协作式调度」的核心：JS 没有抢占式线程调度，一个任务一旦开始就会跑到结束，所以「不卡」这件事只能靠代码自己让路。关键细节：让出的方式分三档——宏任务（`setTimeout`，会排到所有现有任务之后，可能引入 4ms 以上的延迟）、`MessageChannel`（更快但仍然排在渲染之后）、以及 `scheduler.yield()`/`requestIdleCallback` 这类感知优先级的 API；选择哪一档取决于「用户输入的处理优先级是否必须高于我的剩余工作」。还要注意**让出点会打破同步假设**：让出前后的状态读取之间，其它代码可能已经改了数据。

**常见误解**：以为 `await` 一个已解决的 Promise 就等于让出。微任务会在当前宏任务结束前全部清空，`await Promise.resolve()` **不会**让浏览器插进来渲染或处理点击。

也见 [Time Slicing（时间切片）](#time-slicing时间切片)、[Long Task（长任务）](#long-task长任务)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### Virtual List / Windowing（虚拟列表与窗口化）

虚拟列表（窗口化渲染）只把**可视区域附近的那十几条数据渲染成 DOM**，其余用「上下两块等高的空白占位」撑出总滚动高度，滚动时按 `scrollTop` 计算该显示哪一段并复用 DOM 节点。它解决的是「一万条数据生成一万个 DOM 节点」导致的初始化耗时数秒、内存占用巨大、滚动卡顿的问题——因为浏览器处理 10 万个 DOM 节点的代价是压倒性的，而屏幕上永远只能显示十几行。关键细节：实现要点有三——总高度与偏移量的计算、滚动事件的节流、以及**变高行**的处理（需缓存已测高度或用估算 + 动态校正）；列表项的 key 必须稳定，否则复用会串数据。

**常见误解**：以为虚拟列表是「滚动加载更多」的别名。无限滚动只是分批**追加**数据，DOM 总数仍会无限增长；虚拟化的关键在**回收**已有节点，两者可以并用但目标不同。

也见 [Time Slicing（时间切片）](#time-slicing时间切片)、[Reflow / Layout Thrashing（重排与布局抖动）](#reflow-layout-thrashing重排与布局抖动)。

示例：[`31_performance_and_memory/15_virtual_list.js`](31_performance_and_memory/15_virtual_list.js)

### Web Vitals（Web 核心指标）

Web Vitals 是 Google 提出的一组**用来衡量真实用户体验的指标**，其中三项被列为「核心指标（Core Web Vitals）」：**LCP**（加载快不快）、**INP**（响应快不快）、**CLS**（页面稳不稳），此外还有 TTFB、FCP 等辅助指标。它们之所以重要，是因为它们**以用户为中心**而不是以技术为中心——「首字节 200ms」这种服务器视角的指标未必对应「用户觉得快」。关键细节：指标要采**真实用户数据（RUM）**而不是只在实验室环境测，因为设备、网络与用户行为的分布差异极大；用 PerformanceObserver 采集后上报，并关注**75 分位数**而不是平均值（平均值会被大量快用户拉低，掩盖尾部体验）。

**常见误解**：以为 Web Vitals 只关乎 SEO。把它当成「用户实际体验的可量化代理指标」更准确，评分高低本身就是产品体验问题。

也见 [LCP（LCP）](#largest-contentful-paint-lcplcp最大内容绘制)、[CLS（CLS）](#cumulative-layout-shift-clscls累积布局偏移)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Largest Contentful Paint / LCP（LCP，最大内容绘制）

LCP 测量**视口内最大的那块内容元素完成渲染的时刻**，通常就是用户感知到的「页面主要内容出现了」的时间点。它是「加载速度」这一维度的核心指标，良好阈值是 2.5 秒以内。关键细节：LCP 元素通常是首屏大图、大标题或视频海报，因此优化手段集中在——让关键图片**尽早被发现**（不要用 JS 动态插入、不要放在懒加载后面）、用 `fetchpriority="high"` 与 `preload` 提升优先级、压缩图片并用现代格式、减少阻塞渲染的 CSS 与同步脚本、以及用 CDN 缩短首字节时间。要注意**页面加载过程中 LCP 元素会更新**（通常是越换越大），最终上报取最后一次。

**常见误解**：以为 LCP 是「页面 load 事件的时间」。`load` 衡量的是所有资源加载完毕（可能很晚），LCP 衡量的是用户看到主要内容的时间（可能很早），两者差了十万八千里。

也见 [Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)、[CLS（CLS）](#cumulative-layout-shift-clscls累积布局偏移)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Cumulative Layout Shift / CLS（CLS，累积布局偏移）

CLS 量化**页面在加载过程中「意料之外地跳动」的程度**：把每次布局偏移的影响面积与其移动距离相乘，累加成整个会话的分数，良好阈值是 0.1 以下。它衡量的不是速度而是**视觉稳定性**，直接对应「我刚要点按钮，广告加载出来把它挤走了，我点错了」这类糟糕体验。关键细节：最常见的成因是**没有尺寸的图片/视频/iframe**（加载后撑开空间）、**动态插入的横幅与广告**、**后加载的字体导致文字重排（FOIT/FOUT）**、以及先渲染骨架再被真实内容替换时的尺寸不一致。对策是给媒体元素显式写 `width`/`height` 或 `aspect-ratio`、为动态内容预留空间、用 `font-display` 与预加载字体减少文字替换。

**常见误解**：以为「用户主动触发的布局变化」也算 CLS。由用户交互（点击、滚动）直接引起的偏移在测量窗口内会被排除——CLS 针对的是**用户没做任何事时页面自己动了**。

也见 [Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)、[LCP（LCP）](#largest-contentful-paint-lcplcp最大内容绘制)、[Reflow / Layout Thrashing（重排与布局抖动）](#reflow-layout-thrashing重排与布局抖动)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Interaction to Next Paint / INP（INP，交互到下次绘制）

INP 测量**用户的一次交互（点击、按键、触摸）到界面出现视觉反馈之间最长的耗时**，取代了旧的 FID 成为「响应性」维度的核心指标，良好阈值是 200 毫秒以内。它比 FID 严格得多：FID 只测「输入事件的排队延迟」，而 INP 覆盖整个交互生命周期——事件处理函数执行、可能的异步等待、以及随后的渲染，取的是**整次访问中最差的那次交互**（高分位数）。关键细节：改善 INP 的手段就是缩短长任务、拆分耗时工作、让出主线程、以及避免在事件处理里做同步的重活（大循环、布局读取）；调试时用 Performance 面板的 Interactions 轨道可以看清一次交互的时间都花在哪一段。

**常见误解**：以为「事件处理函数跑得快就够了」。视觉反馈还包含后续的渲染，如果处理函数很快但你紧接着又启动了另一个长任务，用户仍然看不到任何变化。

也见 [Long Task（长任务）](#long-task长任务)、[Yield to Main Thread（让出主线程）](#yield-to-main-thread让出主线程)、[Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Reflow / Layout Thrashing（重排与布局抖动）

**重排（reflow/layout）**是浏览器在几何信息变化后重新计算元素位置与尺寸的过程，它比**重绘（repaint）**昂贵得多，而重排之后往往还要重绘再加合成。**布局抖动**指代码在循环里交替「写 DOM」与「读布局属性」——写操作让布局标记为脏，紧接着的读操作（`offsetHeight`、`getBoundingClientRect`、`scrollTop`、`getComputedStyle`）强制浏览器**同步**把布局算完，于是每轮循环都触发一次强制重排，几十次循环就把一帧的预算耗光。关键细节：解法是**读写分离**——先集中读完所有需要的布局值存进变量，再集中写；批量插入用 `DocumentFragment` 或在循环外拼好 HTML；动画优先用 `transform`/`opacity`（只触发合成，不触发布局）。

**常见误解**：以为「重排只发生在修改尺寸时」。读布局属性同样能触发**强制同步布局**，这是最容易被忽略的一类抖动来源。

也见 [Long Task（长任务）](#long-task长任务)、[Virtual List / Windowing（虚拟列表与窗口化）](#virtual-list-windowing虚拟列表与窗口化)、[CLS（CLS）](#cumulative-layout-shift-clscls累积布局偏移)。

示例：[`31_performance_and_memory/07_batch_dom_updates.js`](31_performance_and_memory/07_batch_dom_updates.js)

### Rope（绳索结构）

Rope 是 V8 内部表示**拼接出来的字符串**的一种数据结构：`+=` 不会每次都重新申请内存并复制全部字符，而是把结果表示成「左半 + 右半」的树形节点（ConsString），字符只在真正需要（如取长度以外的随机访问、正则匹配）时才被「拉平」成一段连续内存。这解释了为什么「字符串拼接很慢」这个来自其它语言的直觉在 JS 里并不总成立——连续拼接的摊销成本接近线性。关键细节：拉平是有代价的一次性成本，因此「先拼一万次再取值」通常很快，而「拼一次就取长度、再拼一次再取值」会反复触发拉平；在需要极致性能且有明确规模时，用数组 `join` 或直接构建仍更可控。

**常见误解**：以为「字符串不可变 = 每次拼接都全量复制」。不加区分的说法会让人做出错误的优化（比如为了「性能」把可读的模板字符串换成数组拼接，收益其实微乎其微）。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Big O（大 O 表示法）](#big-o大-o-表示法)。

示例：[`31_performance_and_memory/06_string_concatenation.js`](31_performance_and_memory/06_string_concatenation.js)

## 安全

### Threat Model（威胁模型）

威胁模型是**在动手防御之前，先系统地问清楚「谁、会怎么攻击我、我有哪些资产、最坏会怎样」**。一个常用的拆解框架是四个问题：我们构建什么、什么会出错、我们打算怎么应对、我们做得够好吗；配套工具是 STRIDE 之类的分类表（仿冒、篡改、抵赖、信息泄漏、拒绝服务、权限提升）。关键细节：它的价值在于**排序**——安全资源永远有限，威胁模型让你优先处理「高可能性 × 高影响」的风险，而不是被一篇标题党文章吓得先去修一个你根本没有的问题；威胁模型必须随功能演进而更新，并在新功能设计阶段就做，因为事后补安全的成本要高得多。

**常见误解**：以为威胁模型是「大公司才做的事」。哪怕只用一张纸写下「我们的攻击者是谁（脚本小子还是竞争对手）、他们最可能从哪进来（用户输入、第三方依赖、内部员工）」，也已经比无差别地堆防御有效得多。

也见 [OWASP Top 10（OWASP 十大安全风险）](#owasp-top-10owasp-十大安全风险)、[Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Input Validation（输入校验）

输入校验是**在数据进入系统的边界处检查它是否符合预期**，是所有安全防御的第一道也是最基础的一道。它的核心原则是「**白名单优于黑名单**」：白名单描述「什么是对的」（这个字段必须是 1~64 个字符的邮箱格式），黑名单描述「什么是坏的」（过滤 `<script>`），而攻击面的枚举永远不可能穷尽——`<script>`、`<SCRIPT>`、`<scr\0ipt>`、事件属性、`javascript:` 协议、编码绕过……黑名单的每一次遗漏都是漏洞。关键细节：校验应当**在服务端强制进行**（客户端校验只为体验，可被完全绕过）；校验要检查**类型、长度、范围、格式、集合成员**，而不是只查有没有特殊字符；并且校验后的数据要**以规范化形式**继续流转（校验一次、信任后续），否则就会出现「查过的和用的是两个值」的经典漏洞。

**常见误解**：以为「做了输入校验就不需要输出转义」。校验管的是完整性，转义管的是注入——同一个值进入 HTML、进入 SQL、进入 shell 需要完全不同的处理方式。

也见 [XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[SQL Injection（SQL 注入）](#sql-injectionsql-注入)、[Parameterized Query（参数化查询）](#parameterized-query参数化查询)。

示例：[`32_security_and_best_practices/01_input_validation.js`](32_security_and_best_practices/01_input_validation.js)

### XSS — Cross-Site Scripting（跨站脚本攻击）

XSS 指攻击者**把可执行的脚本注入到你的页面里，让它以你的站点身份在受害者的浏览器中运行**——于是它就能读取 Cookie 与 localStorage、冒充用户发请求、篡改页面内容、记录键盘输入。三种类型：**存储型**（恶意内容存进数据库，所有访问者都中招，危害最大）、**反射型**（恶意内容藏在链接参数里，诱导点击后立即执行）、**DOM 型**（漏洞在客户端 JS 里，服务端根本没参与，比如把 `location.hash` 直接写进 `innerHTML`）。关键细节：防御的核心是**按上下文转义**——插进 HTML 文本要转 `<`/`>`/`&`/引号，插进属性、JS 字符串、CSS、URL 里各有各的规则，用「一套通用转义」是没有意义的；更现代的防御是 CSP 与 Trusted Types（见下）。

**常见误解**：以为「用了框架就自动免疫」。React/Vue 的默认插值确实会转义，但 `dangerouslySetInnerHTML`、`v-html`、以及把用户输入交给 `href`/`src` 时防线立刻消失。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Escaping（转义）](#escaping转义)。

示例：[`32_security_and_best_practices/02_xss_prevention.js`](32_security_and_best_practices/02_xss_prevention.js)

### Escaping（转义）

转义是**把有特殊含义的字符替换成在各目标语言中「只表示它自己」的形式**，从而让数据无法被解释成代码。它对 XSS、SQL 注入、模板注入、日志注入都适用，但**同一份输入在不同上下文里需要不同的转义**：放进 HTML 文本要处理 `& < > " '`，放进 HTML 属性还要考虑属性引号，放进 `<script>` 内部要避免 `</script>` 与 `<!--`，放进 URL 要用百分号编码，放进 SQL 则是参数化（见下）。关键细节：「转义」与「过滤/校验」是两件事——校验决定**要不要接受**这个值，转义保证**接受之后它不会被当成代码**；只做其中一件都不够。

**常见误解**：以为存在「一个万能的转义函数」。跨上下文的转义会互相破坏（HTML 转义后的内容放进 URL 又会被百分号编码一次），这也是现代框架用「类型化的安全字符串」（如 Trusted Types）来强制区分上下文的原因。

也见 [XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Trusted Types（可信类型）](#trusted-types可信类型)。

示例：[`32_security_and_best_practices/02_xss_prevention.js`](32_security_and_best_practices/02_xss_prevention.js)

### CSP — Content Security Policy（内容安全策略）

CSP 是一份通过 HTTP 响应头（或 `<meta>`）下发的**浏览器侧白名单策略**，用来声明「这个页面只允许从哪里加载脚本/样式/图片/字体、只允许连哪些地址」。它把 XSS 的防线从「我转义得对不对」变成「浏览器替我拦住不在白名单里的脚本」——即使某处转义漏了，注入的 `<script>` 也会被拒绝执行。关键细节：CSP 是**声明式、可上报**的（`report-uri`/`report-to` 能收到违规报告），因此上线策略应当先用 `Content-Security-Policy-Report-Only` 观察一段时间再切换到强制模式；`unsafe-inline` 与 `unsafe-eval` 会让策略形同虚设，而一旦放宽了这些，最常见的补偿手段就是 nonce 或 hash（见下）。

**常见误解**：以为「加了 CSP 就安全了」。CSP 是**纵深防御的一层**，不是转义的替代品；它防不住 DOM 型 XSS（数据根本不出现在 HTML 里）、也防不住通过白名单域（如公共 CDN）投放的恶意脚本。

也见 [Nonce（一次性随机数）](#nonce一次性随机数)、[Trusted Types（可信类型）](#trusted-types可信类型)、[SRI（子资源完整性）](#sri-subresource-integrity子资源完整性)。

示例：[`32_security_and_best_practices/13_csp_advanced.js`](32_security_and_best_practices/13_csp_advanced.js)

### Nonce（一次性随机数）

nonce（number used once）是 CSP 用来放行**少量内联脚本**的机制：服务端为每次响应生成一个不可预测的随机串，把它写进 CSP 头的 `'nonce-<值>'`，同时给合法的 `<script nonce="<值>">` 标上同一个值——于是只有「服务端亲手签发的这一批脚本」被允许执行。它的精髓是**随机性与一次性**：攻击者注入的内联脚本无法猜测当次的 nonce，因此被拦截。关键细节：nonce 必须**每次响应用密码学安全的随机数重新生成**（用 `Math.random` 或复用固定值等于自废武功），必须**不能出现在缓存内容里**（CDN 缓存整页会让所有用户共享同一个 nonce），且应当配合 `strict-dynamic` 使用以支持被信任脚本动态加载的模块。

**常见误解**：以为「nonce 是给用户会话用的令牌」。它不标识身份、不做鉴权，只是一个「本次响应的脚本白名单标签」，用完即弃。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Secure Random（安全随机数）](#secure-random安全随机数)、[Trusted Types（可信类型）](#trusted-types可信类型)。

示例：[`32_security_and_best_practices/13_csp_advanced.js`](32_security_and_best_practices/13_csp_advanced.js)

### Trusted Types（可信类型）

Trusted Types 是一项浏览器 API 与配套 CSP 指令，用来**从根上消灭 DOM 型 XSS**：在开启强制策略后，任何可能执行代码的「危险接收点」（`innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write`、`eval`、`script.src` 等）**只接受经过安全策略处理的 TrustedHTML/TrustedScript/TrustedScriptURL 对象**，直接传字符串会抛错。于是「把不可信数据拼进 innerHTML」这个最常见的漏洞模式在语法层面就写不出来了。关键细节：需要用 `trustedTypes.createPolicy()` 显式定义「哪里允许保留 HTML」（通常是经过净化的富文本），因此启用它是一个**需要改造代码的过程**，通常先用 `require-trusted-types-for` 的 report-only 模式收集违规点。

**常见误解**：以为它能替代转义。Trusted Types 强制你**为每个危险写入点明确表态**，但策略本身（比如用哪个净化库）仍要你来选；把策略写成「原样放行」只是把漏洞换了个地方。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[Escaping（转义）](#escaping转义)。

示例：[`32_security_and_best_practices/13_csp_advanced.js`](32_security_and_best_practices/13_csp_advanced.js)

### CSRF — Cross-Site Request Forgery（跨站请求伪造）

CSRF 指攻击者**诱导已登录用户的浏览器，向你的站点发出一条用户并不知情的、携带身份凭证的请求**——浏览器会自动带上该站点的 Cookie，服务器看到合法的会话就直接执行了操作（转账、改密码、删数据）。关键在于攻击者**不需要读到响应**，只需要让请求发出即可，因此 `HttpOnly` Cookie 并不能阻止它。防御手段有五类：**CSRF Token**（表单/头里带一个攻击者猜不到的值，服务端校验）、**SameSite Cookie**（限制跨站请求是否携带 Cookie）、**校验 Origin/Referer**、**关键操作要求重新认证**、以及**避免用 GET 做状态变更**。关键细节：CSRF 的前提是「浏览器自动附带凭证」，因此用 `Authorization` 头携带令牌的 API（不依赖 Cookie）天然免疫；而 XSS 能绕过所有 CSRF 防御（它能直接读到 Token），所以两者的关系是「防住 XSS 才能谈 CSRF 防御」。

**常见误解**：把 CSRF 与 XSS 混为一谈。**XSS 是「把恶意代码注入你的页面」，CSRF 是「借用用户的身份发请求」**；XSS 需要注入点，CSRF 不需要，XSS 的危害通常更大（可以做到 CSRF 能做的一切）。

也见 [XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[SameSite（SameSite Cookie 属性）](#samesitesamesite-cookie-属性)、[CSRF Token（CSRF 令牌）](#csrf-tokencsrf-令牌)。

示例：[`32_security_and_best_practices/11_csrf.js`](32_security_and_best_practices/11_csrf.js)

### SameSite（SameSite Cookie 属性）

SameSite 是 Cookie 的一个属性，用来控制**跨站请求时该 Cookie 是否会被发送**，取值有三：`Strict`（任何跨站请求都不带，从外站链接点进来时用户会短暂处于未登录态）、`Lax`（默认值，顶层导航的 GET 请求会带上，POST、iframe、`fetch` 等跨站子请求不带）、`None`（一律带上，但**必须同时设置 `Secure`**，只能走 HTTPS）。它是浏览器提供的 CSRF 防线中最省事的一层——绝大多数 CSRF 攻击依赖的正是「跨站发起的 POST 请求自动带上 Cookie」，`Lax` 直接切断了这条路。关键细节：`Lax` 并不覆盖所有场景（`GET` 型的状态变更仍然危险），所以它应当与 CSRF Token 配合而非互相替代；跨站需要 Cookie 的合法场景（嵌入式支付、SSO 回调）必须显式声明 `SameSite=None; Secure`。

**常见误解**：以为「设了 SameSite 就不用 Token 了」。`Lax` 对顶层 GET 导航是放行的，如果业务里存在「用 GET 改数据」的接口，这条路依然敞着。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[CSRF Token（CSRF 令牌）](#csrf-tokencsrf-令牌)。

示例：[`32_security_and_best_practices/11_csrf.js`](32_security_and_best_practices/11_csrf.js)

### CSRF Token（CSRF 令牌）

CSRF 令牌是一个**服务端生成、与当前会话绑定、攻击者无法猜到的随机值**：渲染表单时把它放进隐藏字段（或放进响应头/自定义请求头），提交时服务端比对。它能生效的原因是**同源策略**——攻击者的站点无法读取你页面里的 Token（跨域读取被浏览器禁止），因此虽然能伪造请求，却填不出正确的 Token。关键细节：Token 必须**密码学安全随机**（`Math.random` 可被预测）、**与会话绑定**、**在关键操作（登录、改密、支付）时轮换**；把 Token 放在自定义请求头里（如 `X-CSRF-Token`）比放在表单里更省事且能覆盖 AJAX 请求，但此时必须确保 CORS 配置不会把这个头开放给任意来源。

**常见误解**：以为「Token 放在 Cookie 里就行」。Cookie 会被浏览器自动发送给攻击者伪造的请求，等于没设防——Token 必须在**请求体或自定义头**里，由客户端代码显式从别处取来填入。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[SameSite（SameSite Cookie 属性）](#samesitesamesite-cookie-属性)、[Same-Origin Policy / CORS（同源策略与 CORS）](#same-origin-policy-cors同源策略与-cors)。

示例：[`32_security_and_best_practices/11_csrf.js`](32_security_and_best_practices/11_csrf.js)

### Same-Origin Policy / CORS（同源策略与 CORS）

**同源策略**是浏览器的核心安全边界：源由「协议 + 主机 + 端口」三者共同定义，不同源的页面之间**不能读取对方的响应内容**（但可以发出请求）。它正是 XSS 与 CSRF 防御能成立的基石。**CORS** 是一套「服务端显式放行」的机制：当浏览器发现这是一个跨源请求时，会先发预检（`OPTIONS`）询问服务端「允许哪些源、哪些方法、哪些头」，服务端用 `Access-Control-Allow-*` 头回答，通过后才真正发出请求。关键细节：CORS 是**浏览器的限制、由服务端配置解除**，它保护的是用户而不是服务端——因此它**不是**访问控制手段，`curl` 完全无视它；最常见的危险配置是「`Access-Control-Allow-Origin` 回显请求来源」+「`Allow-Credentials: true`」，那等于对所有网站开放了带凭证的接口。

**常见误解**：以为「配了 CORS 才能被访问，所以 CORS 保护了我的 API」。它在服务端不提供任何保护，只影响浏览器是否把响应交给发起方脚本。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)。

示例：[`32_security_and_best_practices/12_cors_and_same_origin.js`](32_security_and_best_practices/12_cors_and_same_origin.js)

### SQL Injection（SQL 注入）

SQL 注入指攻击者**把 SQL 片段伪装成数据送进你的查询里，让数据库把它当成代码执行**——最经典的是 `' OR '1'='1` 绕过登录，或者 `'; DROP TABLE users; --` 直接删库；更隐蔽的用法是通过布尔盲注、时间盲注把整个数据库一点点读出来。它的根源是**字符串拼接**：把用户输入用 `+` 拼进 SQL 文本，数据库就无法区分「哪部分是结构、哪部分是数据」。防御只有一招真正可靠——**参数化查询**（把 SQL 文本和参数分开传给驱动），因为结构在做语法分析时就已经确定，参数永远不可能变成语法。关键细节：服务端校验与转义只能作为补充，因为不同数据库的转义规则、字符集与编码差异（宽字节注入）会让手写转义频繁失守；ORM 的 `where({})` 默认安全，但一旦使用原始查询接口就要重新负起责任。

**常见误解**：以为「转义引号就能防注入」。转义依赖对目标数据库语法与字符集的完美理解，任何一处疏漏都可能被绕过——正确的思路是**结构与数据分离**而不是「把危险字符处理掉」。

也见 [Parameterized Query（参数化查询）](#parameterized-query参数化查询)、[Input Validation（输入校验）](#input-validation输入校验)、[ORM（对象关系映射）](#orm对象关系映射object-relational-mapping)。

示例：[`32_security_and_best_practices/03_sql_injection.js`](32_security_and_best_practices/03_sql_injection.js)

### Parameterized Query（参数化查询）

参数化查询（也叫预处理语句/占位符）把 SQL 拆成**固定的语句模板**与**单独传输的参数**两部分：`db.prepare('SELECT * FROM users WHERE email = ?').get(email)`——数据库先对模板做语法分析与执行计划，然后把参数**当作纯数据绑定进占位符**。由于参数在语法分析阶段根本不存在，用户输入无论包含什么字符都不可能改变查询结构，因此 SQL 注入被彻底消除（而不是被「过滤掉」）。关键细节：这是**唯一被公认为根治手段**的做法，且几乎没有性能代价（还能复用执行计划）；要警惕的是「参数化了值却拼接了标识符」——表名、列名、`ORDER BY` 的方向无法参数化，这些位置必须用**白名单映射**而不是拼接。

**常见误解**：以为 ORM 或存储过程自动安全。ORM 的原始查询接口（`query('... ' + x)`）、存储过程内部拼字符串同样会中招——安全性来自「参数与结构分离」这个做法本身。

也见 [SQL Injection（SQL 注入）](#sql-injectionsql-注入)、[Input Validation（输入校验）](#input-validation输入校验)。

示例：[`32_security_and_best_practices/03_sql_injection.js`](32_security_and_best_practices/03_sql_injection.js)

### Prototype Pollution（原型污染）

原型污染指攻击者**通过 `__proto__`、`constructor.prototype` 这类路径，把属性写进 `Object.prototype`**，从而让「所有对象」都凭空多出一个属性。触发点通常是**不安全的深合并/深拷贝**：递归工具函数逐层复制对象时，遇到键名 `__proto__` 就直接往目标对象的原型上写，于是 `{}['isAdmin']` 变成 `true`，整个应用的逻辑与鉴权判断被诡异地绕过；在服务端还可能被用来改变模板引擎或序列化库的行为，升级成远程代码执行。关键细节：防御手段包括**用 `Object.create(null)` 或 `Map` 存不受信任的键值对**、在合并函数里**跳过 `__proto__`/`constructor`/`prototype` 这三个键**、用 `JSON.parse` 而不是 `eval` 解析、以及冻结 `Object.prototype`（代价是破坏许多库）；在 Node 里还可以用 `--disable-proto=throw`。

**常见误解**：以为「我没写过 `__proto__` 所以与我无关」。漏洞在依赖库的深合并函数里，你只是把它喂给了 `JSON.parse` 出来的对象——这也是它长期位居 OWASP 关注列表的原因。

也见 [Immutability（不可变数据）](#immutability不可变数据)、[Input Validation（输入校验）](#input-validation输入校验)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`32_security_and_best_practices/04_prototype_pollution.js`](32_security_and_best_practices/04_prototype_pollution.js)

### Typosquatting / Dependency Confusion（仿冒包名与依赖混淆）

两者都是**针对包管理器的供应链攻击手法**。**Typosquatting（仿冒抢注）**利用人的拼写疏忽：注册 `lodahs`、`axois`、`cross-env-v2` 这类与知名包极像的名字，一旦有人 `npm install` 打错字就把恶意代码装进了项目。**Dependency Confusion（依赖混淆）**则利用**包名解析优先级**：如果贵公司内部有一个私有包 `@company/utils`（或未加作用域的 `internal-utils`），而攻击者在公共仓库注册一个**同名且版本号更高**的包，配置不当的安装流程可能会优先拉取公共仓库的那个版本，从而在构建机与生产环境执行攻击者的代码。关键细节：防御手段是内部包**统一加作用域**（`@company/`）、在 `.npmrc` 中显式绑定私有源的包范围、锁定精确版本 + 使用锁文件、并对新增依赖做代码评审。

**常见误解**：以为「只装 star 多的包就没事」。依赖混淆攻击的目标恰恰是你**自己团队**的包名，与流行度无关。

也见 [Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)、[Lockfile（锁文件）](#lockfile锁文件)、[SRI（子资源完整性）](#sri-subresource-integrity子资源完整性)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### SRI — Subresource Integrity（子资源完整性）

SRI 是给 `<script>`、`<link>` 等标签加上 `integrity="sha384-..."` 属性，让浏览器在**执行前先校验下载到的文件哈希**是否与页面里写死的一致；不一致就拒绝执行。它防的是**第三方 CDN 被入侵或文件被替换**——CDN 的域名是白名单里的，CSP 拦不住它，但哈希对不上浏览器就会拦住。关键细节：SRI 要求资源**同源或允许跨域（`crossorigin` 属性 + CORS 头）**，否则浏览器无法读取内容做校验；哈希必须在文件内容更新时同步更新（因此构建流程要自动生成而非手写）；现代实践中，把关键依赖**打包进自己的产物**（自托管）往往比依赖第三方 CDN + SRI 更简单可靠。

**常见误解**：以为「有 SRI 就万事大吉」。它只校验**静态文件的完整性**，如果 CDN 上的文件本身就被官方发布了恶意版本（供应链攻击），哈希与恶意内容一致，SRI 帮不上忙。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Authentication vs Authorization（认证与授权）

**认证（Authentication）**回答「**你是谁**」：核对用户名密码、验证令牌签名、完成 OAuth 登录。**授权（Authorization）**回答「**你能做什么**」：这个用户能不能查看这条订单、能不能删除这个资源。两者常被缩写为 AuthN 与 AuthZ，也因此被大量混用。为什么要严格区分？因为它们**失败的后果与修复位置完全不同**：认证失败应当是 401 Unauthorized（并提示去登录），授权失败应当是 403 Forbidden（身份有效但无权限）；如果混淆，客户端就无法判断该跳登录页还是该提示无权限。更关键的是，绝大多数越权漏洞（IDOR：把 URL 里的 `orderId` 改成别人的）都属于**授权缺失**——代码确实验明了身份，却忘了检查「这条数据是不是他的」。

**常见误解**：以为「登录了就有权限」。认证成功只是拿到了身份，每一个涉及资源的操作都必须独立做授权判断——按「先认证整个应用，再对每个对象做授权」的顺序思考，是避免越权的关键。

也见 [Session（会话）](#session会话)、[JWT（JSON Web Token）](#jwt-json-web-tokenjson-web-token)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Session（会话）

会话是**服务端在用户登录后建立的一段有状态身份记录**：生成一个随机的 Session ID 发给浏览器（通常存在 `HttpOnly` Cookie 里），服务端保存这张 ID 到用户信息与过期时间的映射，之后每个请求靠 Session ID 认出「你是谁」。它的优点是**服务端可撤销**——封禁、登出、改密码后立刻失效，敏感信息留在服务端不暴露给客户端。关键细节：Session ID 必须**密码学安全随机、足够长**，并且登录成功后应当**重新生成**（防会话固定攻击：攻击者先给受害者一个已知的 Session ID，受害者登录后该 ID 就成了已认证会话）；Cookie 要设置 `HttpOnly`（JS 读不到，防 XSS 窃取）、`Secure`（只走 HTTPS）、`SameSite`（防 CSRF），并有过期与闲置超时。

**常见误解**：以为「Session ID 放在 Cookie 里就等于把状态放客户端」。状态在服务端，Cookie 里只是那串不透明的查找键。

也见 [JWT（JSON Web Token）](#jwt-json-web-tokenjson-web-token)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)、[CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### JWT — JSON Web Token（JSON Web Token）

JWT 是一段自包含的凭证，由三部分用点号连接：**头部**（算法）、**载荷**（声明，如 `sub`、`exp`、`role`）、**签名**（用密钥对前两段签名）。服务端凭签名就能验证「这段内容确实是我签发的且没被篡改」，因此**无需查库**即可完成认证，很适合分布式与无状态场景。关键细节：JWT 的载荷**只是 Base64URL 编码、不是加密**——任何人都能解开看到内容，所以绝不能放敏感信息；它**天然不可撤销**（签发后在过期前一直有效），因此必须设置较短的 `exp` 并配合刷新令牌；最著名的实现漏洞是**算法混淆攻击**（服务端信任头部声明的 `alg`，攻击者改成 `none` 或把 RS256 换成 HS256 用公钥当 HMAC 密钥）——服务端必须**写死自己期望的算法**，绝不信任头部。另外 JWT 不解决 CSRF：若存在 Cookie 里，仍然需要 CSRF 防护。

**常见误解**：以为「JWT 比 Session 更安全」或「JWT 能替代 Session」。它换来的是无状态与跨服务便利，代价是不可撤销与令牌管理复杂度，两者是权衡而非升级关系。

也见 [Session（会话）](#session会话)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)、[Timing Attack（时序攻击）](#timing-attack时序攻击)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Password Hashing（密码哈希）

密码绝不能以明文或可逆加密存储，而应存**单向哈希**：登录时把用户输入的密码同样哈希后与库里的值比对。为什么不能用 MD5/SHA-256 这类通用哈希？因为它们**太快了**——现代 GPU 每秒可以计算上百亿次 SHA-256，泄露的哈希库可以在数小时内被穷举破解。正确选择是**专门的密码哈希函数**（bcrypt、scrypt、argon2、PBKDF2），它们通过「可调的计算成本」把每次验证拉长到几十到几百毫秒，让离线暴力破解在经济上不可行；argon2 还额外抗 GPU/ASIC（内存硬），是当前的首选。关键细节：成本参数要**随硬件进步定期调高**（参数可以存在哈希串里，因此不同用户可以有不同参数）；哈希算法要留升级路径（登录成功后按需重新哈希）；并且**永远不要自己实现密码哈希算法**。

**常见误解**：以为「加了盐的 SHA-256 就够安全」。盐只防彩虹表与「相同密码产生相同哈希」，完全不能阻止高速穷举——慢哈希才是关键，盐是它自带的配套。

也见 [Salt（加盐）](#salt加盐)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)、[Timing Attack（时序攻击）](#timing-attack时序攻击)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Salt（加盐）

盐是**为每个密码单独生成的随机值**，与密码一起参与哈希并被一同存储。它解决两个问题：**彩虹表**（预计算的海量「常见密码 → 哈希」对照表）失效，因为同一个密码配上不同的盐会得到完全不同的哈希；以及**批量破解效率**（不加盐时，攻击者可以一次算出一个哈希就同时命中所有用该密码的账号；加盐后每个账号都要单独算）。关键细节：盐必须是**密码学安全的随机数、全局唯一、足够长**（通常 16 字节以上），并且**不需要保密**（它就和哈希存在一起）；盐是「每密码唯一」而不是「全局共享」——用一个固定盐只能防彩虹表、防不住批量破解。现代密码哈希函数（bcrypt/argon2）会**自动生成并内嵌盐**，因此通常不需要手工管理。

**常见误解**：以为盐能防住暴力破解或让弱密码变安全。盐只增加攻击者的**摊销成本**，`123456` 加任何盐都还是弱密码；抗暴力破解靠的是「慢」和「限流」。

也见 [Password Hashing（密码哈希）](#password-hashing密码哈希)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)、[Rate Limiting（速率限制）](#rate-limiting速率限制)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Slow Hash（慢哈希，bcrypt / argon2 / scrypt）

慢哈希是一类**故意设计成计算昂贵**的密码哈希函数，代表实现有 bcrypt、scrypt、argon2（以及 PBKDF2）。它们的共同点是提供一个**成本参数**（bcrypt 的轮数因子、argon2 的内存/时间/并行度），让「算一次」的耗时可控地拉长到 50~500 毫秒——对真实登录来说完全可接受（用户一年也就登录几百次），但对攻击者来说，每一次猜测的成本被乘以同样的倍数，穷举从「小时级」变成「天文数字级」。三者的差异：bcrypt 成熟稳定、结果长度固定（有 72 字节输入上限，超长密码需要先做预处理）；scrypt 与 argon2 是**内存硬**的，需要大量内存才能计算，因此对 GPU/ASIC 并行破解的抵抗力更强，argon2id 目前是最推荐的默认选择。关键细节：参数选择要**以本地实测耗时为准**（比如目标 250ms），并随硬件升级而调高。

**常见误解**：以为「慢哈希会拖慢登录所以不好」。拖慢的正是攻击者最需要的东西，而合法的登录请求配合**限流**后完全不受影响。

也见 [Password Hashing（密码哈希）](#password-hashing密码哈希)、[Salt（加盐）](#salt加盐)、[Rate Limiting（速率限制）](#rate-limiting速率限制)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Timing Attack（时序攻击）

时序攻击是一种**旁路攻击**：攻击者不破解算法，而是通过测量**响应时间的细微差异**反推秘密信息。最经典的例子是字符串比较——`if (input === secret)` 在第一个字符不匹配时就立刻返回，而在前若干字符都匹配时会更慢地走到下一轮，因此攻击者可以逐字节地试出正确的值（比如重置密码的令牌、API Key）。同理，用户名不存在时立即返回、存在时才开始做密码哈希，会泄漏「哪些用户名是有效的」。关键细节：防御手段是**常量时间比较**（无论内容如何都比完全部字节）、对不存在的账号也执行一遍「假哈希」让两条路径耗时一致、以及为敏感操作加入随机延迟作为补充；要注意 JS 里 `===` 对字符串的比较、`Array.prototype.includes` 等都是短路语义，不能用于秘密比较。

**常见误解**：以为「网络抖动那么大，时序差异根本测不出来」。攻击者可以发送成千上万次请求取统计分布，毫秒甚至微秒级的系统性差异在足够样本下非常显著。

也见 [Constant-Time Comparison（常量时间比较）](#constant-time-comparison常量时间比较)、[Secure Random（安全随机数）](#secure-random安全随机数)、[Password Hashing（密码哈希）](#password-hashing密码哈希)。

示例：[`32_security_and_best_practices/09_secure_random.js`](32_security_and_best_practices/09_secure_random.js)

### Constant-Time Comparison（常量时间比较）

常量时间比较指**比较两个值时不提前返回、不做数据相关的分支**，而是遍历全部字节并把差异累积起来，最后一次性判断，使耗时与「匹配了多少前缀」无关。它是抵御时序攻击的直接手段，用于所有涉及秘密的比较（会话令牌、重置令牌、API Key、HMAC 签名）。关键细节：JS 里的 `===`、`localeCompare`、`Buffer.compare` 都是短路的，不能用于秘密；Node 提供了 `crypto.timingSafeEqual(a, b)` 专门做这件事（要求两个 Buffer **长度相同**，否则会抛错——而「先比长度」本身也是泄漏，通常做法是先哈希到固定长度再比较）；由于 JS 引擎的 JIT 与垃圾回收会引入噪声，严格意义上这里只是「**尽可能**常量时间」，因此绝不能把它当成唯一防线。

**常见误解**：以为「我先检查长度再比较内容就够了」。长度检查本身泄漏了长度信息，同时也让两条分支的耗时不同。

也见 [Timing Attack（时序攻击）](#timing-attack时序攻击)、[Secure Random（安全随机数）](#secure-random安全随机数)。

示例：[`32_security_and_best_practices/09_secure_random.js`](32_security_and_best_practices/09_secure_random.js)

### Secure Random（安全随机数）

安全随机数指**密码学安全伪随机数生成器（CSPRNG）**产出的随机值，其输出不可预测、不可从历史输出反推下一次结果。JS 里必须使用 `crypto.getRandomValues()`（浏览器/Web Crypto）或 `crypto.randomBytes()`/`crypto.randomUUID()`（Node），**绝不能用 `Math.random()`**——后者的实现是可预测的（种子可从少量输出反推），用它生成会话 ID、重置令牌、CSRF nonce 等于把系统敞开。关键细节：还有个隐蔽的坑是**取模偏差**：`randomValue % max` 会让某些值出现得略多（除非 `max` 能整除随机数空间），需要做**拒绝采样**（落在超出区间时重取）来消除偏向；此外随机值要**足够长**（会话 ID 通常至少 128 位）以抵抗穷举。

**常见误解**：以为「`Math.random()` 看起来够随机了」。安全的判据不是「像不像随机」而是「攻击者能否预测」，而 `Math.random` 的答案是能。

也见 [Timing Attack（时序攻击）](#timing-attack时序攻击)、[Nonce（一次性随机数）](#nonce一次性随机数)、[Constant-Time Comparison（常量时间比较）](#constant-time-comparison常量时间比较)。

示例：[`32_security_and_best_practices/09_secure_random.js`](32_security_and_best_practices/09_secure_random.js)

### Rate Limiting（速率限制）

速率限制是**在单位时间内限制某个主体能发起的请求数量**，超限返回 429 Too Many Requests 并通常附带 `Retry-After`。它有三重作用：**防暴力破解**（把「每秒猜一万个密码」压到「每分钟 5 次」）、**防资源滥用与爬虫**（保护成本敏感的下游）、以及**保证公平性**（防止单个客户端挤占所有容量）。关键细节：限流的**维度**比算法更重要——按 IP、按账号、按 API Key、按接口路径，不同维度防的是不同攻击（按 IP 挡不住分布式攻击，按账号挡不住撞库时的账号喷洒，因此常需要多维度组合）；被限流时的响应要区分对待（对攻击者要静默拒绝并记录，对正常用户要给出友好提示），并且要注意**别把限流做成拒绝服务**：按 IP 限流时，大量用户共享出口 IP（公司网络、运营商 NAT）会被整片误伤。

**常见误解**：以为「限流能防住分布式暴力破解」。攻击者用海量 IP 时，单 IP 阈值毫无作用——此时必须叠加「按账号锁定 + 指数退避 + 异常行为检测」。

也见 [Token Bucket / Leaky Bucket（令牌桶与漏桶）](#token-bucket-leaky-bucket令牌桶与漏桶)、[Brute Force Protection（暴力破解防护）](#brute-force-protection暴力破解防护)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)。

示例：[`32_security_and_best_practices/16_rate_limiting.js`](32_security_and_best_practices/16_rate_limiting.js)

### Token Bucket / Leaky Bucket（令牌桶与漏桶）

这是两种最常用的限流算法。**令牌桶**按固定速率往桶里放令牌，请求到来时拿走一个令牌，拿不到就限流；桶有容量上限，因此允许**一定量的突发**（桶里攒了 10 个令牌，就能瞬间放行 10 个请求）。**漏桶**把请求先放进队列，再以**恒定速率**流出，超出队列容量就丢弃——它把流量整形成绝对平滑的输出，不允许突发。选择依据是业务需不需要突发：绝大多数 API 用令牌桶（用户偶尔连点几下是正常的），而对下游有严格平稳要求的场景用漏桶。还有一种常用的**固定窗口计数**（每分钟清零），实现最简单但存在「窗口边界双倍流量」的缺陷（59 秒发 100 次、1 分 00 秒再发 100 次），**滑动窗口**可以修复它。

**常见误解**：以为「记录每个 IP 的请求次数」就是限流。简单的固定窗口计数在窗口边界处会放行两倍流量，需要滑动窗口才能得到真实速率。

也见 [Rate Limiting（速率限制）](#rate-limiting速率限制)、[Circuit Breaker（熔断器）](#circuit-breaker熔断器)、[Retry（重试）](#retry重试)。

示例：[`32_security_and_best_practices/16_rate_limiting.js`](32_security_and_best_practices/16_rate_limiting.js)

### Brute Force Protection（暴力破解防护）

暴力破解指攻击者**用大量候选值反复尝试**——猜密码、猜验证码、猜重置令牌、猜用户 ID。防护必须是**多层叠加**的，因为任何单层都有绕过方式：**限流**（按 IP 与按账号双维度）、**指数锁定**（连续失败后延迟逐步拉长甚至临时锁定账号）、**慢哈希**（让每次尝试本身就很贵，把在线爆破的成本提高几个数量级）、**验证码/人机校验**（在阈值后触发）、**强密码策略与泄露密码库比对**（从源头减少可猜中的密码）、以及**对失败的响应做统一化**（不区分「用户不存在」与「密码错误」，不泄漏账号是否存在）。关键细节：账号锁定机制本身可被武器化——攻击者故意用错误密码反复尝试某个已知用户名，就能把他锁在门外（账号锁定 DoS），因此更稳妥的做法是**指数退避 + 记录异常 + 触发二次验证**，而不是简单硬锁。

**常见误解**：以为「密码够复杂就不会被爆破」。撞库用的不是随机猜测，而是从其它站点泄露的真实「邮箱 + 密码」组合——防御重点在于**检测异常登录模式**与**限制尝试速率**。

也见 [Rate Limiting（速率限制）](#rate-limiting速率限制)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)。

示例：[`32_security_and_best_practices/16_rate_limiting.js`](32_security_and_best_practices/16_rate_limiting.js)

### Path Traversal（路径遍历）

路径遍历（也叫目录穿越）指攻击者**在文件路径参数里塞进 `../` 之类的序列，跳出你预期的目录去读取或写入任意文件**：`GET /files?name=../../../etc/passwd`。它出现的原因是「把用户输入直接拼进文件路径」，而路径里的 `..` 具有语义。防御的核心手段是**规范化后校验**：把拼好的路径用 `path.resolve()` 解析成绝对路径（消除所有 `..`），再检查它是否**以允许的基准目录开头**（注意要比较带分隔符的完整片段，否则 `/data/allowed-evil` 会通过 `/data/allowed` 的前缀检查）。关键细节：只过滤 `../` 字符串是黑名单思维，会被 URL 编码（`%2e%2e%2f`）、双重编码、绝对路径、Windows 的反斜杠与短文件名（`8.3` 格式）、以及符号链接绕过；更彻底的做法是**不直接用用户输入做路径**（改用 ID 到路径的映射表），或者用 `path.basename()` 只取文件名丢弃目录部分。

**常见误解**：以为「把 `/` 过滤掉就安全了」。编码、反斜杠、绝对路径都是绕过路径，安全来自**规范化 + 白名单前缀校验**而不是字符过滤。

也见 [SSRF（服务端请求伪造）](#ssrf-server-side-request-forgery服务端请求伪造)、[Input Validation（输入校验）](#input-validation输入校验)。

示例：[`32_security_and_best_practices/17_path_traversal_and_ssrf.js`](32_security_and_best_practices/17_path_traversal_and_ssrf.js)

### SSRF — Server-Side Request Forgery（服务端请求伪造）

SSRF 指攻击者**诱使你的服务器去请求一个他指定的地址**，从而借服务器之手访问他够不到的网络位置。危害在于服务器的网络位置通常比攻击者好得多——它可以访问**内网服务**（`http://10.0.0.5/admin`）、**云元数据接口**（`http://169.254.169.254/` 可以拿到临时凭证，一次拿下整个云账号）、以及 localhost 上只监听本机的管理端口。触发点是任何「由用户提供 URL」的功能：图片抓取、Webhook、URL 预览、PDF 生成、代理。防御手段包括：**协议白名单**（只允许 http/https，挡掉 `file://`、`gopher://`、`dict://`）、**解析后校验目标 IP 并拒绝私有/环回/链路本地地址段**、**禁止跟随重定向**（重定向是绕过前置校验的经典手段）、**独立的出网出口并限制可达范围**、以及对响应做大小与超时限制。关键细节：域名 → IP 的解析存在 **DNS rebinding**（校验时解析到公网 IP、真正请求时解析到内网），因此必须**校验最终连接的 IP** 而不是只校验域名。

**常见误解**：以为「只允许 http/https 就没问题」。只要目标地址可以是内网，攻击者就能用合法协议打到内部服务；协议白名单只是第一层。

也见 [Path Traversal（路径遍历）](#path-traversal路径遍历)、[Input Validation（输入校验）](#input-validation输入校验)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/17_path_traversal_and_ssrf.js`](32_security_and_best_practices/17_path_traversal_and_ssrf.js)

### Sandboxing（沙箱）

沙箱是**在一个受限环境中执行不受信任的代码**，限制它能触碰的资源（文件、网络、进程、内存）以便即使它心怀恶意也造不成大破坏。它不是「一层 API」而是**隔离层级的连续谱**：从最弱到最强大致是「语言级限制（无 `eval` 的受限解释器、`node:vm`）→ 独立进程 + 权限限制（seccomp/容器/低权限用户）→ 虚拟机 → 独立物理机」。关键细节：选择哪一档取决于**代码的敌意程度**——自己人写的、可能出 bug 的插件代码可以用轻量隔离；完全来自互联网的代码必须用进程或虚拟机级隔离并配资源限额；此外沙箱必须同时限制**时间**（超时终止死循环）、**内存**（防止 OOM）与**输出**（防止刷爆日志）。

**常见误解**：以为「在主进程里跑不可信代码 + 加几个检查」就安全了。隔离强度取决于**最外层的边界**，进程内的任何「检查」都能被绕过。

也见 [node:vm 的局限](#nodevm-的局限limitations-of-nodevm)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/18_sandboxing.js`](32_security_and_best_practices/18_sandboxing.js)

### node:vm 的局限（Limitations of node:vm）

`node:vm` 可以把一段字符串当代码在一个**独立的上下文**里执行（`vm.runInNewContext`），看起来像沙箱，但 Node 官方文档明确写着「**它不是安全机制**」。原因很实际：它只隔离了「全局变量」这一层，逃逸手段却很多——传入上下文的对象（哪怕只是一个普通对象）可以被拿去访问它的 `constructor`，进而拿到宿主的 `Function`，再执行任意代码；`this.constructor.constructor('return process')()` 这类一行代码就能突破；即使只传原始值，也仍有原型链与异常对象带来的泄漏路径。因此 `node:vm` 的正确用途是**执行自己信任但需要隔离状态的代码**（模板、配置求值、测试夹具），而不是执行用户的代码。真正的沙箱需要**进程级隔离**（`child_process` + 资源限制 + 降权）、容器、或专用沙箱服务。

**常见误解**：以为「用 `vm` 加上删除 `process`/`require` 就安全了」。逃逸靠的是**运行时对象图的可达性**，删除几个显眼的名字完全不足以封住它。

也见 [Sandboxing（沙箱）](#sandboxing沙箱)、[Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/18_sandboxing.js`](32_security_and_best_practices/18_sandboxing.js)

### OWASP Top 10（OWASP 十大安全风险）

OWASP Top 10 是 OWASP 组织发布的**最严重的 Web 应用安全风险清单**，每几年更新一次，用于把「该优先修什么」在全行业对齐。近年上榜的典型条目包括：失效的访问控制（越权）、加密机制失效、注入（含 XSS 与 SQL 注入）、不安全设计、安全配置错误、使用含有已知漏洞的组件、身份认证与鉴权失效、软件与数据完整性失效（供应链）、安全日志与监控失效、以及 SSRF。关键细节：它是一份**认知清单而不是合规标准**——榜单排名反映的是「普遍程度 × 危害 × 可检测性」的综合，不是「你的系统一定按这个顺序有问题」；使用方法应当是对照它做一次自查，再结合自己的威胁模型确定优先级；此外还有配套的 ASVS（应用安全验证标准）适合需要具体可测条款的场景。

**常见误解**：以为「通过了 OWASP Top 10 检查就安全了」。它覆盖的是**常见风险类别**，且清单本身不检查你的具体业务逻辑漏洞（比如业务层面的越权、刷单、价格篡改）。

也见 [Threat Model（威胁模型）](#threat-model威胁模型)、[Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Principle of Least Privilege（最小权限原则）

最小权限原则要求**每个主体（用户、服务、进程、令牌）只被授予完成其任务所必需的最小权限，且只在该任务需要的时间内持有**。它承认「任何防线都可能被突破」，因此把目标从「绝不失守」调整为「失守之后能坏多少」——一个只读数据库账号被盗，损失远小于一个拥有 `DROP` 权限的账号。落地方式很具体：数据库账号按服务拆分权限、容器里用非 root 用户运行、云上给实例绑定最小策略的 IAM 角色、API Token 限定作用域（scope）与来源、后台管理界面与前台业务分离、以及避免长期有效的凭证（优先用短期令牌）。关键细节：它与**纵深防御**是一对搭档——最小权限限制「一个点失守」的爆炸半径，纵深防御延缓「突破下一个点」的速度。

**常见误解**：以为「内部服务之间没必要限制」。攻击者一旦进入内网，横向移动（lateral movement）能力完全取决于每个节点的权限大小，内部无限制正是重大事故的放大器。

也见 [Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)、[SSRF（服务端请求伪造）](#ssrf-server-side-request-forgery服务端请求伪造)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Defense in Depth（纵深防御）

纵深防御主张**用相互独立的多层防线保护同一资产**，使得任何单层的失误或绕过都不足以造成完整失陷。它基于一个务实的假设：**任何一层都会失效**——WAF 有规则盲区、转义有上下文遗漏、密码有人为弱口令、员工有被钓鱼的可能。在 XSS 场景里的典型分层是：输入校验（限制形状）→ 上下文转义（消除注入）→ CSP（拦截漏网脚本）→ Trusted Types（从 API 层面禁掉危险写入）→ `HttpOnly` Cookie（即使脚本执行了也偷不走会话）→ 监控上报（发现攻击尝试）。关键细节：「独立」是这个原则的关键——如果两层依赖同一个假设（比如都依赖「用户输入里不含 `<`」），那本质上仍然只有一层。

**常见误解**：以为「开了 WAF 就够了」或「写了转义就够了」。纵深防御的重点不是堆工具，而是**假设每一层都会失败，问下一层是什么**。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)、[Threat Model（威胁模型）](#threat-model威胁模型)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）

敏感信息泄漏指**密码、令牌、身份证号、银行卡号、内部堆栈与配置出现在不该出现的地方**：日志文件、错误响应、监控系统、URL 查询串、以及给前端返回的对象里。它之所以危险，是因为这些通道的**访问控制通常比数据库弱得多**——日志会被采集到第三方平台、错误信息会被用户截图、URL 会进浏览器历史与 Referer 头。防御的核心手段是**两条通道分离 + 出口脱敏**：对内日志保留完整堆栈与 `traceId` 便于排查，对外响应只给一个通用的错误码与 `traceId`（用户报障时凭它到日志里查具体原因），绝不给客户端堆栈、SQL 语句或内部路径；同时对所有输出通道做**统一的脱敏**（`password`、`token`、`authorization`、`set-cookie` 等字段名一律打码），并且从源头避免把敏感字段放进 DTO。

**常见误解**：以为「返回值里删掉 `password` 就行了」。序列化器、日志中间件、异常堆栈、`console.error(err)` 都可能把整个对象打出来；脱敏必须落在**输出边界**上，而不是依赖调用方自觉。

也见 [Structured Logging（结构化日志）](#structured-logging结构化日志)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)。

示例：[`32_security_and_best_practices/08_error_message_hygiene.js`](32_security_and_best_practices/08_error_message_hygiene.js)

### Immutability（不可变数据）

不可变性指数据创建后**不再被修改**，任何「变更」都产生一个新对象。它在安全与正确性上有多重价值：让「不受信任的对象在传递过程中被悄悄加字段」变得不可能（这也是原型污染与参数篡改类漏洞的天然屏障）、让状态变化有迹可循（便于审计与回溯）、让并发与缓存不会有隐性串味。关键细节：JS 里最常见的陷阱是 `Object.freeze()` **只做浅冻结**——`freeze(obj)` 之后 `obj.nested.x = 1` 依然能改，深层冻结需要递归；而 `const` 只保证「绑定不变」，完全不保证内容不变（`const arr = []; arr.push(1)` 完全合法）。实践上更常用**结构化克隆式的不可变更新**（展开运算符逐层复制，或用 `structuredClone` 做深拷贝），代价是深拷贝的开销会随对象大小增长。

**常见误解**：以为「用了 `const` 就不可变」或「`Object.freeze` 能冻结整棵对象树」。这两条都只覆盖表面一层。

也见 [Prototype Pollution（原型污染）](#prototype-pollution原型污染)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)、[Memento（备忘录模式）](#memento备忘录模式)。

示例：[`32_security_and_best_practices/06_immutability.js`](32_security_and_best_practices/06_immutability.js)
