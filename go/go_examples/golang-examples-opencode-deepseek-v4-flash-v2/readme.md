# Go 语言示例代码集

一套全面的 Go 1.25 示例代码, 按知识点组织, 帮助有编程基础的开发者通过实例学习 Go 语言。

## 目录结构

| 目录 | 知识点 | 文件数 |
|------|--------|--------|
| 01_hello_world | Hello World 入门 | 1 |
| 02_variables | 变量声明、常量、零值、空标识符、类型别名 | 5 |
| 03_data_types | 基本数据类型和类型转换 | 2 |
| 04_control_flow | if-else、for、switch、goto、range over int | 5 |
| 05_collections | 数组、切片、映射 | 3 |
| 06_functions | 函数定义、多返回值、变参、闭包、defer、init | 6 |
| 07_pointers | 指针 | 1 |
| 08_structs | 结构体、方法、嵌入、结构体标签 | 4 |
| 09_interfaces | 接口、空接口、类型断言 | 3 |
| 10_error_handling | 错误处理、自定义错误、panic/recover | 3 |
| 11_strings | 字符串操作、strings.Builder | 2 |
| 12_time | 时间处理 | 1 |
| 13_random | 随机数(math/rand/v2, crypto/rand) | 1 |
| 14_file_io | 文件读写、bufio、JSON 序列化 | 3 |
| 15_concurrency | goroutine、channel、select、WaitGroup、Mutex、Once、Cond、sync.Map | 8 |
| 16_networking | TCP 服务器/客户端、HTTP 服务器/客户端、增强路由、TLS/HTTPS | 6 |
| 17_generics | 泛型基础、泛型约束、cmp 包(Go 1.21+) | 3 |
| 18_os_operations | 环境变量、执行系统命令、filepath 路径操作 | 3 |
| 19_logging | 日志记录 | 1 |
| 20_flags | 命令行参数解析 | 1 |
| 21_encoding | Base64 编码、Hex 编码 | 2 |
| 22_templates | 文本模板、HTML 模板(自动XSS转义) | 2 |
| 23_sorting | 排序(basic、sort.Interface) | 2 |
| 24_crypto | SHA-256 哈希、HMAC | 1 |
| 25_context | Context 取消、超时、传值 | 3 |
| 26_signal | 信号处理(优雅关闭) | 1 |
| 27_reflection | 反射 | 1 |
| 28_compression | gzip 压缩 | 1 |
| 29_testing | 单元测试、基准测试、子测试(Subtests) | 4 |
| 30_json | JSON 流式编码解码 | 1 |
| 31_sync_advanced | atomic、sync.Pool | 2 |
| 32_iterators | range over func 迭代器(Go 1.23+) | 1 |
| 33_slices_advanced | slices 包(Go 1.21+) | 1 |
| 34_io_interfaces | io.Reader 和 io.Writer 接口模式 | 1 |
| 35_regexp | 正则表达式 | 1 |
| 36_slog | log/slog 结构化日志(Go 1.21+) | 1 |
| 37_embed | embed 嵌入静态文件(Go 1.16+) | 1 |
| 38_maps_advanced | maps 包(Go 1.21+, Clone/Copy/Equal/DeleteFunc) | 1 |
| 39_fuzzing | Fuzz 测试(Go 1.18+) | 2 |
| 40_net_url | net/url URL 解析与构建 | 1 |
| 41_csv | encoding/csv 读写 | 1 |
| 42_archive | archive/zip 创建与读取 | 1 |
| 43_runtime | runtime 运行时信息(GC、goroutine、内存) | 1 |
| 44_modules | Go Modules 模块管理、replace 本地依赖 | 2 |
| 45_http_advanced | HTTP 中间件模式、httptest 测试 | 2 |
| 46_binary | encoding/binary 二进制编解码 | 1 |

共 **46 个知识点目录**, **97 个可编译示例文件**。

## 使用方式

### 运行单个示例

```bash
go run 01_hello_world/01_hello_world.go
```

### 编译单个示例

```bash
go build -o hello.exe 01_hello_world/01_hello_world.go
```

### 编译所有示例

Windows:
```bat
build.bat
```

Linux/Mac:
```bash
chmod +x build.sh
./build.sh
```

编译后的可执行文件位于 `build/` 目录。

### 运行测试

```bash
# 单元测试
go test ./29_testing/ -v
go test ./29_testing/ -bench=. -benchmem
go test ./29_testing/ -cover

# Fuzz 测试
go test ./39_fuzzing/ -v
go test ./39_fuzzing/ -fuzz=FuzzReverse -fuzztime=5s
```

### 运行 HTTP/TCP 网络示例

先启动服务器, 再启动客户端:

```bash
# 终端1: 启动 TCP 服务器
go run 16_networking/01_tcp_server.go

# 终端2: 启动 TCP 客户端
go run 16_networking/02_tcp_client.go
```

```bash
# 终端1: 启动 HTTP 服务器
go run 16_networking/03_http_server.go

# 终端2: 发送 HTTP 请求
go run 16_networking/04_http_client.go

# 访问增强路由 (Go 1.22+)
go run 16_networking/05_http_enhanced_router.go
```

## 知识点说明

- 每个示例文件头部包含知识点说明、详细的中文注释以及编译运行方法
- 示例代码遵循 Go 最佳实践和惯用写法
- 涵盖 Go 1.25 的主要特性(泛型、range over func、slices/maps 包、slog、fuzz 等)
- 包含标准库常用包的使用示例

## 系统要求

- Go 1.25+
- 支持 Windows、Linux、macOS
