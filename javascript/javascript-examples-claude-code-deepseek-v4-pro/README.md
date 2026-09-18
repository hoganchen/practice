# JavaScript 示例代码集

一套面向**已有编程基础**的学习者的 JavaScript 示例代码仓库。

不做百科式的语法罗列，而是**一个文件讲透一个细分知识点**：每个示例都可独立运行、都有详细的中文注释、
都在文件头部写清楚了「这个知识点是什么、为什么需要、怎么运行、会输出什么」。

> 如果你已经会 C / Java / Python / Go 中的任意一门，想系统补齐 JavaScript，
> 这个仓库就是按这条路径组织的：从 `Hello World` 一路走到异步、原型、Node.js 与工程实践。

---

## 目录

- [快速开始](#快速开始)
- [安装 Node.js](#安装-nodejs)
- [配置 npm](#配置-npm)
- [代理与镜像设置](#代理与镜像设置)
- [安装本仓库依赖](#安装本仓库依赖)
- [运行第一个示例](#运行第一个示例)
- [知识点总览](#知识点总览)
- [学习路线建议](#学习路线建议)
- [示例文件的统一结构](#示例文件的统一结构)
- [运行方式详解](#运行方式详解)
- [批量校验](#批量校验)
- [约定与规范](#约定与规范)

> 📑 **想看逐个文件的知识点清单？** 见 **[INDEX.md](INDEX.md)** ——
> 按目录列出全部 504 个示例的知识点与难度，由 `npm run index` 自动生成。
>
> 📚 **遇到不认识的术语？** 见 **[GLOSSARY.md](GLOSSARY.md)** ——
> 1100+ 条 JavaScript 术语的中文详解，每条都尽量链到讲解它的示例文件。

---

## 快速开始

### 环境要求

| 项目 | 要求 |
| --- | --- |
| Node.js | **18 或更高版本**（推荐 22+，本仓库在 Node 24 上验证通过）——还没装？见 [安装 Node.js](#安装-nodejs) |
| npm | 随 Node.js 一起安装即可，无需单独安装 |
| 浏览器 | 任意现代浏览器，用于打开 `.html` 示例（主要在 `27_web_apis/`） |
| 网络 | 大部分示例**完全离线可跑**；只有 [安装本仓库依赖](#安装本仓库依赖) 需要联网 |

检查版本：

```bash
node --version   # 应输出 v18.x.x 或更高
npm --version
```

**关于 Node 版本，需要说清楚一件事：**

- `package.json` 的 `engines` 声明为 `>=18`，这是**能跑起来**的下限。
- 但本仓库实际是在 **Node 24** 上验证全部 504 个示例的，**并未在 Node 18 上逐一验证过**。
- 较新的特性（`node:sqlite`、迭代器助手、`Set` 集合运算、`using` 显式资源管理、
  `JSON.rawJSON`、`Promise.try`、全局 `WebSocket` 等）都做了**特性检测**：
  当前环境不支持时会走降级分支并打印说明，而不是崩溃。
- 想要**完整体验、不出现降级提示**，建议使用 **Node 22 或更高**；本仓库的完整校验结果是 Node 24 下的。

---

## 安装 Node.js

如果你机器上已经有可用的 Node（`node --version` 能输出 `v18` 以上），可以直接跳到
[验证安装](#验证安装)。

### 方式一：官方安装包（最省事）

到 [nodejs.org](https://nodejs.org/) 下载 **LTS** 版本。注意选 LTS 而不是 Current ——
Current 是最新特性版，稳定性不如 LTS。

| 平台 | 做法 |
| --- | --- |
| Windows | 下载 `.msi` 双击安装；或用命令行 `winget install OpenJS.NodeJS.LTS` |
| macOS | 下载 `.pkg`；或 `brew install node` |
| Linux | 可用发行版仓库（`apt install nodejs npm`），但**版本往往偏旧**，更推荐下面的版本管理器 |

> Windows 安装时保持默认勾选项，其中「Add to PATH」必须勾上，否则命令行里找不到 `node`。

### 方式二：版本管理器（推荐）

如果你会同时接触多个项目，**强烈建议用版本管理器**而不是官方安装包。理由：

- 不同项目常要求不同的 Node 版本，装错了很难排查；
- 切换/升级/回退都是一条命令；
- 不需要管理员权限，也不污染系统目录。

| 工具 | 适用平台 | 安装方式 |
| --- | --- | --- |
| **nvm** | macOS | `brew install nvm`，或官方安装脚本 |
| **nvm** | Linux | 官方安装脚本（brew 在 Linux 上不是预装的，装 nvm 也不推荐走 brew） |
| **nvm-windows** | Windows | 从 [nvm-windows releases](https://github.com/coreybutler/nvm-windows/releases) 下载 `nvm-setup.exe` |
| **fnm** | 跨平台 | macOS：`brew install fnm`；Windows：`winget install Schniz.fnm`；Linux：官方安装脚本或 `cargo install fnm` |

> ⚠️ **nvm-windows 和 macOS/Linux 上的 nvm 是两个不同作者的项目**，命令相似但不完全一致，
> 网上查资料时注意区分平台。

#### 什么叫「官方安装脚本」

指的是 nvm 作者自己仓库 [nvm-sh/nvm](https://github.com/nvm-sh/nvm) 里的 `install.sh`。
它做的事情很简单：用 `git` 把 nvm 克隆到 `~/.nvm`，然后往你的 shell 配置文件
（`~/.bashrc`、`~/.zshrc` 等）末尾追加两行 `source`，让每次开终端都自动加载 nvm。
没有编译、没有 `sudo`、不动系统目录，所以比 brew 更适合装在 Linux 上。

macOS / Linux 通用的一条命令：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash
```

几点说明：

- URL 里的 `v0.40.7` 是版本号，安装前建议去
  [nvm 仓库](https://github.com/nvm-sh/nvm#install--update-script) 确认有没有更新的版本——这个数会变，写死在文档里容易过期；
- 脚本跑完**必须重开终端**（或 `source ~/.bashrc`）才能用 `nvm`，否则会提示 command not found；
- 卸载就是删掉 `~/.nvm` 和 shell 配置里那两行 `source`。

不想 `curl | bash` 的话，手动克隆是等价做法，效果完全一样：

```bash
git clone https://github.com/nvm-sh/nvm.git ~/.nvm
cd ~/.nvm && git checkout v0.40.7
```

常用命令（nvm / nvm-windows 通用）：

```bash
nvm install 24        # 安装 Node 24
nvm use 24            # 切换到 24
nvm list              # 列出已安装版本（nvm-windows 用 nvm list）
nvm alias default 24  # 设为默认版本（nvm-windows 用 nvm use 24 后自动记住）
```

**本仓库已经提供了 `.nvmrc`（内容为 `24`）**，所以在仓库目录下直接执行
`nvm use`（不带版本号）就会读到它并切到 24。fnm 同样支持。

### 验证安装

```bash
node --version    # 期望 v18.x.x 以上，推荐 v22+
npm --version     # 随 Node 一起装好
```

再确认一下 `node` 到底来自哪里（排查「版本对不上」时很有用）：

```bash
which node        # macOS / Linux
where node        # Windows CMD / PowerShell
```

常见现象：

- `node` 能用但 `npm` 找不到 → 版本管理器的 PATH 没配好，重开一个终端再试；
- `node --version` 显示的版本和你刚装的不是同一个 → 系统里装了多个 Node，
  `which node` 看到的是另一个（官方安装包与版本管理器冲突是典型场景）。

---

## 配置 npm

### 查看当前配置

```bash
npm config get registry    # 当前使用的源
npm config list            # 全部配置
```

配置文件的优先级从低到高：

| 位置 | 说明 |
| --- | --- |
| `~/.npmrc`（Windows：`%USERPROFILE%\.npmrc`） | 用户级，影响你这台机器上的所有项目 |
| 项目根目录 `.npmrc` | 项目级，只影响本项目 |

> 本仓库**故意没有**放 `.npmrc`，免得覆盖你个人的源与代理配置。

### 修改 registry（换镜像源）

官方源是 `https://registry.npmjs.org/`。

如果你在中国大陆，安装依赖慢或频繁超时，可以换成国内镜像：

```bash
npm config set registry https://registry.npmmirror.com
```

> ⚠️ **注意**：老教程里常见的 `registry.npm.taobao.org` **已经停止服务**，
> 继续用它会出现证书错误或连接失败。现在的正确地址是 `registry.npmmirror.com`。

只给这一次安装临时指定源（不改全局配置）：

```bash
npm install --registry=https://registry.npmmirror.com
```

改回官方源：

```bash
npm config set registry https://registry.npmjs.org
```

确认是否生效：

```bash
npm config get registry
npm ping                  # 需要联网，能通会打印 PONG
```

### 全局安装目录（作用、权限问题与替代方案）

#### 它到底管什么

`npm install -g` 装的包**不进入任何项目的 `node_modules`**，而是装到一个"全局目录"里。
这个目录里的东西分两部分，真正起作用的是后者：

| 位置 | 内容 | 在 PATH 上？ |
| --- | --- | --- |
| `<prefix>/lib/node_modules/`（Windows：`<prefix>\node_modules\`） | 包本体 | ❌ |
| `<prefix>/bin/`（Windows：`<prefix>\` 根下直接放 `.cmd` 垫片） | 可执行文件 | ✅ **关键在这** |

所以「配全局目录」这件事，本质上是**往 PATH 上多加一个目录**。

由此推出该装什么、不该装什么：

- **该全局装**：`eslint`、`typescript`、`pnpm`、`nodemon` 这类**命令行工具**；
- **不该全局装**：`lodash`、`axios`、`express` 这类**要被代码 `import` 的库**。

> ⚠️ **全局装了 ≠ 代码里能 import。**
> Node 解析模块时只沿着当前目录往上的 `node_modules` 链查找，**从不看全局目录**。
> 所以 `npm i -g lodash` 之后，代码里写 `import _ from 'lodash'` 照样报
> `Cannot find module`。（`NODE_PATH` 能绕过，但官方已明确不推荐，不要用。）

想看自己的全局目录在哪：

```bash
npm prefix -g          # 全局目录（bin 所在）
npm root -g            # 包本体的实际位置
npm ls -g --depth=0    # 当前装了哪些全局包
```

#### 权限问题（仅 Linux / macOS）

如果 `npm install -g` 报 `EACCES: permission denied`，**不要用 `sudo npm install -g`**
（会让全局目录归属 root，后患更多）。正确做法是把全局目录改到用户目录下：

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH   # 把这行写进 ~/.bashrc 或 ~/.zshrc 使其永久生效
```

三行各自的含义：第一行建目录；第二行告诉 npm「以后全局装到这里」；**第三行才让命令能被找到**——
漏掉第三行就会出现「装的时候成功，敲命令却 command not found」，这是最常见的踩坑点。

> 💡 **Windows 用户不需要这一步。** 全局目录默认在 `%APPDATA%\npm`，
> 天生就位于你的用户目录下，不会出现 `EACCES`，也不需要 `sudo`。
> 用上面的 `npm prefix -g` 可以确认自己机器上的实际位置。

#### 更推荐：尽量别用全局安装

| 场景 | 做法 |
| --- | --- |
| 偶尔用一次某个 CLI | `npx eslint .` —— 临时下载到缓存，不落全局 |
| 项目要用的工具 | 装进 `devDependencies`，用 npm scripts 调用 |
| 包管理器本身（pnpm / yarn） | 用 corepack，连它也不用全局装 |

**为什么项目内更好**：版本跟着项目走，你、同事、CI 跑的是同一份。全局装的话，
你本地是 eslint 10、同事本地是 eslint 9，规则行为不一致——这类问题极难排查。

> 本仓库就是这么做的：[package.json](package.json) 里 `eslint` / `prettier` / `vitest`
> 全在 `devDependencies`，通过下面的 `npm run lint` 等脚本调用，本文档全程没让你全局装过东西。

#### 将来换用 nvm / fnm 要注意

macOS / Linux 的 nvm 把全局目录放在 `~/.nvm/versions/node/<版本>/` 下，**每个 Node 版本一份**。
所以 `nvm use 22` 之后，你在 24 下全局装的 eslint 会"消失"——其实还在，只是 PATH 指向了另一个版本。
`nvm reinstall-packages <version>` 可以把全局包迁移过去。

nvm-windows 的行为不同（默认所有版本共用 `%APPDATA%\npm`），换用前建议自行确认。

---

## 代理与镜像设置

先分清两件事，**它们解决的是不同问题**：

| 你的情况 | 该用什么 |
| --- | --- |
| 只是下载慢 / 偶尔超时 | **换 registry 镜像**就够了，不需要代理 |
| 公司内网、必须经 HTTP 代理才能上外网 | 配 **npm 代理** 或 **环境变量代理** |

### 给 npm 配置代理

```bash
npm config set proxy http://127.0.0.1:7890
npm config set https-proxy http://127.0.0.1:7890
```

端口按你本机代理软件的实际监听端口填（Clash 常见 `7890`，V2Ray 常见 `10809`）。
需要用户名密码时写成 `http://user:pass@proxy.company.com:8080`。

取消代理：

```bash
npm config delete proxy
npm config delete https-proxy
```

### 用环境变量配置代理（更通用）

环境变量不只 npm 认，很多命令行工具都认：

```bash
# macOS / Linux（写进 ~/.bashrc 或 ~/.zshrc 可永久生效）
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890
export NO_PROXY=localhost,127.0.0.1,::1
```

```powershell
# Windows PowerShell（当前会话有效）
$env:HTTP_PROXY="http://127.0.0.1:7890"
$env:HTTPS_PROXY="http://127.0.0.1:7890"
$env:NO_PROXY="localhost,127.0.0.1,::1"
```

```bat
:: Windows CMD（当前会话有效）
set HTTP_PROXY=http://127.0.0.1:7890
set HTTPS_PROXY=http://127.0.0.1:7890
set NO_PROXY=localhost,127.0.0.1,::1
```

> ⚠️ **`NO_PROXY` 对本仓库特别重要。**
> 本仓库所有网络类示例（`26_node_core`、`27_web_apis`、`36_realtime_and_streams` 等）
> 访问的都是文件内自建的 `127.0.0.1` 本地服务。如果代理把本地地址也拦截了，
> **这些示例会全部失败**。请务必把 `localhost` 和 `127.0.0.1` 写进 `NO_PROXY`。

### git 的代理要单独设

`npm install` 有时会通过 git 从 GitHub 拉包，而 **npm 的代理配置不会作用于 git**，
需要单独配置：

```bash
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 取消
git config --global --unset http.proxy
git config --global --unset https.proxy
```

查看当前 git 代理配置：

```bash
git config --global --get http.proxy
```

### 证书报错怎么办

公司内网做 TLS 拦截时，会报这类错误：

```
UNABLE_TO_VERIFY_LEAF_SIGNATURE
self signed certificate in certificate chain
```

**正确做法**是让 npm 信任公司的根证书：

```bash
npm config set cafile /path/to/company-root-ca.pem
```

> ❌ **不推荐** `npm config set strict-ssl false`。
> 它关闭了证书校验，等于给中间人攻击开了门。只在临时排查时用，查完立刻改回来。

### 装不上时按这个顺序排查

1. `npm config get registry` —— 源对不对（是不是还残留已停用的淘宝老域名）
2. `npm config get proxy` 和 `npm config get https-proxy` —— 有没有残留一个早就关掉的代理
3. `npm ping` —— 能不能连上 registry
4. 代理软件是否真的在运行，端口是否和配置一致
5. `npm install --verbose` —— 看详细日志定位到具体是哪一步卡住
6. 都不行就清缓存重来：`npm cache clean --force` 后重新 `npm install`

---

## 安装本仓库依赖

```bash
# 1. 进入仓库目录
cd javascript-examples

# 2. 安装依赖（仅少数目录需要，见下表）
npm install
```

> 绝大多数示例只用 Node.js 内置模块，**不装依赖也能跑**
> —— 事实上即使 `npm install` 失败，你依然可以学习 41 个目录中的绝大部分内容。

需要第三方依赖的目录：

| 目录 | 用到的依赖 |
| --- | --- |
| `29_npm_libraries`（含 13~16） | lodash、dayjs、axios、zod、uuid、chalk、commander、dotenv、express、`ws` |
| `28_testing` | vitest（仅 `10_vitest_intro.js` 做对比说明，其余用 Node 内置 `node:test`） |
| `36_realtime_and_streams` | `ws`（WebSocket 服务端） |
| `39_tooling_and_workflow` | ESLint、Prettier、semver |

>`35_web_crypto`、`38_algorithms_and_data_structures`、`40_functional_programming`
>等目录**零外部依赖**，只用标准库。

---

## 运行第一个示例

```bash
node 00_hello_world/01_hello_world.js
```

输出：

```
Hello, World!
数字： 42 布尔值： true
1 + 2 = 3
"1" + "2" = 12
程序结束，共执行完毕。
```

---

## 知识点总览

每个目录对应一个大的知识板块，目录下的每个文件对应一个细分知识点。

下表是**目录级**总览。需要**文件级**清单（每个示例讲什么、什么难度）请看 [INDEX.md](INDEX.md)。

| 目录 | 知识点 | 主要内容 |
| --- | --- | --- |
| `00_hello_world` | 起步 | 最小可运行程序、console 方法、浏览器版 Hello World、Node 与浏览器的差异 |
| `01_syntax_basics` | 语法基础 | 语句与表达式、自动分号插入、注释规范、严格模式、标识符与命名 |
| `02_variables` | 变量声明 | `var` / `let` / `const` 三者的行为差异、变量提升、暂时性死区（TDZ） |
| `03_data_types` | 数据类型 | 7 种原始类型、`typeof`、类型转换、浮点精度、BigInt、Symbol、真值假值、相等性比较 |
| `04_operators` | 运算符 | 算术、赋值、比较、逻辑短路、`??`、`?.`、位运算、展开与剩余、优先级 |
| `05_control_flow` | 流程控制 | `if` / `switch` / `for` / `while`、`for...of` vs `for...in`、标签语句、卫语句 |
| `06_functions` | 函数 | 声明与表达式、参数与默认值、箭头函数、IIFE、`call`/`apply`/`bind`、高阶函数、递归、柯里化 |
| `07_scope_and_closure` | 作用域与闭包 | 全局/函数/块级作用域、作用域链、词法作用域、闭包的原理与实战（记忆化、防抖、私有状态） |
| `08_arrays` | 数组 | 增删改查、`slice`/`splice`、`map`/`filter`/`reduce`、排序、扁平化、浅拷贝与深拷贝、链式实战 |
| `09_objects` | 对象 | 字面量、属性访问、计算属性名、展开合并、`Object.*` 工具方法、属性描述符、冻结、深拷贝 |
| `10_destructuring` | 解构赋值 | 对象/数组/嵌套解构、默认值、函数参数解构、变量交换、可迭代对象解构 |
| `11_strings` | 字符串 | 模板字符串、检索与变换方法、`replace` 系列、Unicode 与码点、标签模板、实用工具函数 |
| `12_numbers_and_math` | 数值与 Math | `Math` 方法、取整、随机数与洗牌、`parseInt` 陷阱、数值边界、`Intl.NumberFormat`、精度处理 |
| `13_regexp` | 正则表达式 | 字符类、量词、锚点、分组与反向引用、前瞻后顾、修饰符、校验实战、灾难性回溯 |
| `14_classes` | 类 | `class` 语法、实例/静态成员、私有字段、`get`/`set`、继承、继承内置类、混入、多态 |
| `15_this_and_context` | this 与执行上下文 | 四种绑定规则及优先级、箭头函数的 `this`、回调中的 `this`、`globalThis` |
| `16_prototype` | 原型与继承 | 原型链、`__proto__` vs `prototype`、ES5 继承写法、`Object.create`、原型污染 |
| `17_iterators_and_generators` | 迭代器与生成器 | 可迭代协议、迭代器协议、自定义可迭代对象、`function*`、`yield*`、惰性序列、异步迭代器 |
| `18_async` | 异步编程 | 事件循环与宏微任务、回调地狱、Promise 全解、`async`/`await`、并发控制、超时与取消 |
| `19_modules` | 模块化 | 具名/默认导出、重导出、命名空间导入、实时绑定、动态 `import()`、ESM 与 CommonJS 对比 |
| `20_error_handling` | 错误处理 | `try`/`catch`/`finally`、内置错误类型、自定义错误类、`error.cause`、Node 错误码、断言 |
| `21_json` | JSON | 解析与序列化、`replacer`/`reviver`、序列化陷阱、`toJSON`、读写 JSON 文件、JSON Lines |
| `22_date_and_time` | 日期时间 | `Date` 创建与陷阱、时间戳、日期运算、格式化、时区、`Intl.DateTimeFormat`、Temporal |
| `23_collections` | 集合类型 | `Map` / `Set` 的用法与遍历、集合运算、`WeakMap` / `WeakSet`、与对象/数组的对比 |
| `24_typed_arrays` | 二进制数据 | `ArrayBuffer`、`DataView`、TypedArray 家族、字节序、TextEncoder、Buffer、Base64、压缩、Blob 互转 |
| `25_proxy_and_reflect` | 元编程 | `Proxy` 各类陷阱、运行时校验、响应式原理、`Reflect` API、`Proxy` 的局限 |
| `26_node_core` | Node.js 核心模块 | `process`、`path`、`url`、`fs`、`events`、`streams`、`child_process`、`crypto`、Worker、`SharedArrayBuffer`/`Atomics`、`parseArgs` 与进程信号 |
| `27_web_apis` | 浏览器 Web API | DOM 查询与操作、事件与委托、表单校验、`fetch`、本地存储、URL 与历史、Canvas、Blob/File/FormData、三大 Observer、跨上下文通信、拖放与剪贴板 |
| `28_testing` | 测试 | 为什么测试、Node 内置测试运行器、`assert`、测试结构、测试替身、异步测试、TDD、快照、测试金字塔与 E2E、模块级 mock、HTTP 层测试 |
| `29_npm_libraries` | 常用第三方库 | lodash、dayjs、axios、zod、uuid、chalk、commander、dotenv、express、`ws`、结构化日志、数据库与 ORM、重试与弹性 |
| `30_design_patterns` | 设计模式 | GoF 常用模式、状态、模板方法、结构型与行为型补充、SOLID、依赖注入、装饰器语法、应用架构模式 |
| `31_performance_and_memory` | 性能与内存 | 防抖节流、记忆化、复杂度实测、对象形状、内存泄漏、基准测试、GC 原理、内存剖析、长任务调度、虚拟列表、Web Vitals |
| `32_security_and_best_practices` | 安全与最佳实践 | 输入校验、XSS、SQL 注入、原型污染、`eval`、不可变数据、JSDoc、CSRF、CORS、CSP、供应链、认证授权、限流、路径遍历与 SSRF、沙箱、OWASP 清单 |
| `33_intl` | 国际化 API | `Intl` 全家族：`Collator` 本地化排序、`PluralRules` 复数、`ListFormat`、`Segmenter` 分词与字素簇、`DisplayNames`、`Locale`、最佳实践 |
| `34_modern_es_features` | 现代 ES 新特性 | ES2021→ES2025 逐版本盘点、迭代器助手、Set 集合运算、`Promise.try`、`RegExp.escape`、`using` 显式资源管理 |
| `35_web_crypto` | Web Crypto API | `crypto.subtle` 总览、SHA 摘要、HMAC 签名、AES-GCM 加解密、PBKDF2 密钥派生、ECDSA 密钥对，均与 `node:crypto` 交叉验证 |
| `36_realtime_and_streams` | 实时通信与流 | WebSocket（`ws`）基础与广播、Server-Sent Events、Web Streams（`ReadableStream`/`TransformStream`）、与 Node Streams 的互转 |
| `37_debugging_and_profiling` | 调试与性能剖析 | 调用栈追踪、`debugger` 与 `--inspect`、Source Map 原理、`perf_hooks`、内存诊断、生产环境错误上报 |
| `38_algorithms_and_data_structures` | 算法与数据结构 | 复杂度分析、链表、栈与队列、哈希表、二叉搜索树、堆与优先队列、图遍历、经典排序与查找、动态规划 |
| `39_tooling_and_workflow` | 工程化工具链 | `package.json` 字段、npm scripts 与生命周期、semver、ESLint、Prettier、打包与 tree-shaking、锁文件与 CI、质量工作流 |
| `40_functional_programming` | 函数式编程进阶 | 函子、Maybe、Either、Monad 与三条定律、point-free 与管道、代数数据类型与模式匹配模拟 |

---

## 学习路线建议

知识点之间存在依赖关系，建议按下面的顺序推进。

### 第一阶段：语言核心（必学，顺序推进）

```
00_hello_world
  → 01_syntax_basics
  → 02_variables
  → 03_data_types
  → 04_operators
  → 05_control_flow
  → 06_functions
  → 07_scope_and_closure      ← 闭包是 JS 的分水岭，务必吃透
  → 08_arrays
  → 09_objects
  → 10_destructuring
  → 11_strings
  → 12_numbers_and_math
```

### 第二阶段：面向对象与元编程

```
14_classes  →  15_this_and_context  →  16_prototype
```

> 建议顺序：先学 `this` 再看 `class`，最后看原型。
> `class` 只是原型继承的语法糖，理解原型才能理解 `class` 的边界。

### 第三阶段：异步与模块化（现代 JS 的分水岭）

```
17_iterators_and_generators  →  18_async  →  19_modules  →  20_error_handling
```

> `18_async` 是全仓库最值得反复看的部分。
> 尤其是 `02_event_loop_basics.js` 和 `12_microtask_vs_macrotask.js`，
> 理解了执行顺序，异步的很多"玄学问题"都会消失。

### 第四阶段：标准库与进阶主题

```
21_json  22_date_and_time  23_collections  24_typed_arrays  25_proxy_and_reflect
13_regexp  33_intl  35_web_crypto
```

> `33_intl` 不只是"格式化数字和日期"。`Intl.Segmenter` 是正确处理
> emoji 与中文分词的标准手段，`Intl.Collator` 才能做对中文拼音排序 ——
> 这两件事用普通字符串方法是做不对的。

### 第五阶段：现代特性与函数式

```
34_modern_es_features  →  40_functional_programming  →  38_algorithms_and_data_structures
```

> `34` 解决"这个特性我的目标环境支持吗"；
> `38` 补齐算法与数据结构 —— 它们与语言无关，但用 JS 实现一遍才算真正掌握。

### 第六阶段：运行时与工程实践

```
26_node_core  →  27_web_apis  →  36_realtime_and_streams
  →  28_testing  →  29_npm_libraries  →  39_tooling_and_workflow
  →  30_design_patterns  →  31_performance_and_memory
  →  32_security_and_best_practices  →  37_debugging_and_profiling
```

> `39_tooling_and_workflow` 是"从会写 JS 到能在团队里交付"的一步。
> `37_debugging_and_profiling` 建议不要留到最后 —— 遇到问题时随时回来查。

---

## 示例文件的统一结构

每个 `.js` 示例文件都以同一套头部注释块开头。看注释就能决定要不要读这个文件。

```js
/**
 * ============================================================================
 * 知识点：箭头函数与普通函数的差异
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】入门
 * 【前置知识】06_functions/01_declaration_vs_expression.js
 *
 * 【知识点说明】
 *   1. 是什么
 *   2. 为什么需要 / 解决什么问题
 *   3. 核心语法要点
 *   4. 常见陷阱与注意事项
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/05_arrow_vs_regular.js
 *
 * 【预期输出】
 *   逐项对比箭头函数与普通函数在 this、arguments、new 等维度的行为差异。
 * ============================================================================
 */
```

正文里：

- 注释全中文，关键语法**逐行**解释
- 用 `console.log('--- 1. xxx ---')` 这类小标题分隔输出，便于对照阅读
- 会「报错」的演示一律在文件内部 `try/catch` 后打印错误，**不会让进程非零退出**

---

## 运行方式详解

### 运行 `.js` 示例

**在仓库根目录**执行（这一点很重要，示例中的相对路径都基于仓库根目录）：

```bash
node 06_functions/03_arrow_functions.js
```

### 运行 `.html` 示例（浏览器）

仓库里的 `.html` 文件是浏览器示例，**直接双击用浏览器打开即可**，
不需要启动服务器，不依赖任何外部资源（无 CDN、无外链、样式内联）。

主要分布在 `27_web_apis/`（18 个），另有入门篇 `00_hello_world/03_hello_world_in_browser.html`。
这些页面上有可点击的按钮和可视化的结果区域，打开就能看到效果。

> ⚠️ 部分浏览器 API 在 `file://` 协议下会被限制（如 `Clipboard`、
> `navigator.storage`、`pushState`）。这些示例内部已经做了降级处理并会在页面上给出提示，
> 但如果你想体验完整效果，可以用任意静态服务器打开，例如：
> `npx serve .` 然后访问 `http://localhost:3000/27_web_apis/`。

### 关于模块系统

`package.json` 中设置了 `"type": "module"`，因此：

- `.js` 文件一律按 **ES Module**（`import` / `export`）解析
- 需要演示 **CommonJS** 的文件使用 `.cjs` 扩展名（`require` / `module.exports`）

这样两种模块系统在同一个仓库里可以共存，也正好方便对照学习。

### 关于辅助文件

以 `_` 开头的文件（如 `_math-utils.js`）是**被主文件导入的辅助模块**，
它们本身不是独立示例，批量校验脚本会自动跳过。

---

## 批量校验

仓库自带一个校验脚本，会递归运行所有示例并检查它们是否都能正常退出。

```bash
# 运行全部示例并输出通过/失败汇总
npm run check

# 只列出会被运行的文件，不实际执行
npm run check:list

# 只运行路径中包含指定字符串的示例
node scripts/run-all.js --only 08_arrays

# 打印每个示例的完整输出
node scripts/run-all.js --verbose

# 自定义超时时间（毫秒，默认 30000）
node scripts/run-all.js --timeout 60000
```

输出示例：

```
开始校验 504 个示例（超时 30000ms）...

  00_hello_world/
    ✓ 01_hello_world.js
    ✓ 02_console_methods.js
  ...

========================================================================
通过 504 / 504，失败 0
========================================================================
```

任何示例失败时会打印完整的 stdout / stderr，便于定位。

`.html` 浏览器示例不会被 `run-all.js` 运行（它们需要浏览器），
但可以用另一个脚本检查其内联脚本的语法：

```bash
npm run check:html     # 校验全部 .html 的内联 <script> 语法
```

### 索引生成

[INDEX.md](INDEX.md) 是**生成物**，不要手工编辑。增删或重命名示例后重新生成：

```bash
npm run index          # 重新生成 INDEX.md
npm run index:check    # 只检查 INDEX.md 是否已过期（CI 用）
```

### 文档链接校验

README 与本索引里有大量「章节跳转」锚点。锚点写错在渲染后只是个点了没反应的死链，
**不会报任何错**，很容易长期烂着。所以单独做了校验：

```bash
npm run check:docs     # 校验 README.md 与 INDEX.md 的锚点与相对链接
node scripts/check-docs.js --all   # 校验仓库里所有 .md
```

### 文档数字校验

INDEX.md 与 GLOSSARY.md 里的数字是**生成的**，不会错。但**本页**里的数字全是**手写的**——
示例数、`.html` 数、辅助模块数、知识目录数、链接总数——它们过期之后**不会有任何报错**，
只是安静地变成错的（本仓库真实发生过：「辅助模块 18 个」实际 17、
「`27_web_apis` 里 14 个 html」实际 18、链接总数写成 3451 而实际 3497）。

```bash
npm run check:counts   # 校验本页的统计数字与实际是否一致
```

校验规则写在 `scripts/check-counts.js` 的 `RULES` 清单里，是一条条正则，
捕获到数字后与仓库实际状态比对。两个设计细节值得注意：

- **规则匹配不到会报错，而不是放过。** 如果你改写了本页里某句带数字的话，
  导致正则匹配不上，脚本会提示「校验规则已失效」——空转的校验比没有校验更危险。
- **加了链接就要同步改本页第 5 项的链接总数。** 校验失败时会直接把实际值印出来，
  照着改即可。

### 一次跑完所有检查

```bash
npm run check:all
```

它会依次执行六项，全过才算仓库健康：

| 顺序 | 检查内容 | 对应命令 |
| --- | --- | --- |
| 1 | 504 个示例是否都能正常运行（退出码 0） | `npm run check` |
| 2 | 19 个 `.html` 的内联脚本语法 | `npm run check:html` |
| 3 | INDEX.md 是否与当前示例同步 | `npm run index:check` |
| 4 | GLOSSARY.md 是否与分册同步 | `npm run glossary:check` |
| 5 | 文档内部链接是否有死链（三个文档共 3497 个链接） | `npm run check:docs` |
| 6 | 本页手写的统计数字是否与实际一致 | `npm run check:counts` |

### 术语表

[GLOSSARY.md](GLOSSARY.md) 收录 1100+ 条 JavaScript 术语，按 35 个领域分组，
每条含中文详解与「常见误解」，并尽量链到仓库中讲解它的示例文件。

它同样是**生成物**，源文件是按领域拆分的分册（放在 `.glossary_parts/`）：

```bash
npm run glossary          # 由分册合并生成 GLOSSARY.md
npm run glossary:check    # 检查 GLOSSARY.md 是否与分册一致
npm run glossary:stats    # 只统计各领域的术语数量
```

> 为什么拆成多个分册：单文件超过 8000 行后，任何修改都容易冲突。
> 分册便于分领域维护，读者看到的仍是合并后的单一文档。
> **想改术语表就改 `.glossary_parts/` 下的分册，然后重跑 `npm run glossary`。**

当前仓库状态：

| 类别 | 数量 |
| --- | --- |
| 知识点目录 | 41 个（`00` ~ `40`，编号连续无断档） |
| Node.js 可运行示例（`.js` / `.cjs`） | 504 个 |
| 浏览器示例（`.html`） | 19 个 |
| 被导入的辅助模块（`_` 开头，不计入上两项） | 17 个 |

> 全部 504 个 Node.js 示例连续多次全量运行均 **504 / 504 通过**，
> 且运行后仓库中不产生任何残留文件。

---

## 约定与规范

为了让示例可读、可靠，本仓库遵守以下约定：

1. **一个文件一个知识点。** 只有知识点之间强关联时才放在一起（如模块的导出与导入）。
2. **所有示例都能独立运行且以退出码 0 结束。**
   演示报错的示例在内部 `try/catch`，不会让进程崩溃。
3. **示例不访问外网。** 需要网络时用 `node:http` 在文件内自建本地服务器，用完即关。
   这样所有示例都能离线运行，也不会因为外部服务变动而失效。
4. **示例不在仓库里留下垃圾文件。** 需要读写文件时一律使用系统临时目录。
5. **示例不挂起进程。** 涉及服务器、定时器、Worker 的示例都会主动清理并正常退出。
6. **命名规范：**
   - 目录：`序号_知识点名称`，如 `18_async`，序号从 `00` 连续编号
   - 文件：`序号_细分知识点名称.js`，如 `04_promise_basics.js`
   - 辅助模块：以 `_` 开头，如 `_math-utils.js`
   - 文件名**允许保留 API 原本的大小写**（如 `07_forEach.js`、`11_flat_and_flatMap.js`），
     因为文件名与所讲的方法同名更便于检索；除此之外一律小写。

---

## 附：本仓库不适合做什么

- ❌ **不是 API 手册。** 想查某个方法的完整签名，请查 MDN。
  这里的目标是让你**理解**知识点，而不是替代文档。
- ❌ **不是零基础教程。** 假设你已经会至少一门编程语言，不会解释"什么是变量"。
- ❌ **不是框架教程。** 不涉及 React / Vue / Angular 等框架，聚焦 JavaScript 语言本身与运行时。

---

## 参考资源

- [MDN Web Docs — JavaScript](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript)
- [ECMAScript 语言规范](https://tc39.es/ecma262/)
- [Node.js 官方文档](https://nodejs.org/docs/latest/api/)
- [JavaScript.info](https://javascript.info/)
