# Go 语言示例代码

一套覆盖 Go 语言主要知识点的示例代码集合，适合有编程基础的学习者通过实例快速掌握 Go。

## 环境要求

- **Go 版本**: 1.21+（推荐 1.25+，以体验最新语言特性）
- **安装指南**: https://go.dev/dl/

```bash
# 验证安装
go version
```

## 目录结构

```
├── README.md                          # 本文件
├── build_all.bat                      # Windows 批量编译脚本
├── build_all.sh                       # Linux/macOS 批量编译脚本
├── go.work                            # Go Workspace 文件
│
├── 01_hello_basics/                   # 基础语法
│   ├── 01_hello_world.go              # 第一个程序
│   ├── 02_variables.go                # 变量声明
│   ├── 03_constants.go                # 常量与 iota
│   └── 04_data_types.go               # 数据类型
│
├── 02_control_flow/                   # 流程控制
│   ├── 01_if_else.go                  # 条件判断
│   ├── 02_switch.go                   # Switch 语句
│   └── 03_for_loop.go                 # 循环（for/range）
│
├── 03_functions/                      # 函数
│   ├── 01_functions.go                # 函数定义与可变参数
│   ├── 02_multi_return.go             # 多返回值与命名返回值
│   ├── 04_closures.go                 # 闭包
│   └── 05_defer.go                    # defer 延迟调用
│
├── 04_collections/                    # 集合类型
│   ├── 01_arrays.go                   # 数组
│   ├── 02_slices.go                   # 切片
│   ├── 03_maps.go                     # Map
│   └── 04_strings.go                  # 字符串操作
│
├── 05_structs_interfaces/             # 结构体与接口
│   ├── 01_structs.go                  # 结构体定义与标签
│   ├── 02_methods.go                  # 方法（值/指针接收者）
│   ├── 03_embedding.go                # 结构体嵌入
│   ├── 04_interfaces.go               # 接口与类型断言
│   └── 05_generics.go                 # 泛型（Go 1.18+）
│
├── 06_pointers/                       # 指针
│   └── 01_pointers.go                 # 指针基础
│
├── 07_error_handling/                 # 错误处理
│   ├── 01_errors.go                   # error 接口与哨兵错误
│   ├── 02_custom_errors.go            # 自定义错误类型
│   └── 03_panic_recover.go            # panic 与 recover
│
├── 08_concurrency/                    # 并发编程
│   ├── 01_goroutines.go               # Goroutine 基础
│   ├── 02_channels.go                 # Channel 通信
│   ├── 03_channel_directions.go       # Channel 方向
│   ├── 04_select.go                   # select 多路复用
│   ├── 05_sync_waitgroup.go           # sync.WaitGroup
│   └── 06_mutex.go                    # 互斥锁与数据竞争
│
├── 09_file_io/                        # 文件 I/O
│   ├── 01_file_write_read.go          # 文件读写
│   ├── 02_bufio.go                    # 缓冲 I/O
│   └── 03_json.go                     # JSON 序列化
│
├── 10_time/                           # 时间操作
│   └── 01_time.go                     # time 包用法
│
├── 11_context/                        # 上下文
│   └── 01_context.go                  # context 包
│
├── 12_testing/                        # 测试
│   ├── 01_math.go                     # 被测试的函数
│   └── 01_math_test.go                # 单元测试、表驱动测试、基准测试
│
├── 13_networking/                     # 网络编程
│   ├── 01_http_server.go              # HTTP 服务器
│   └── 02_http_client.go              # HTTP 客户端
│
├── 14_reflection/                     # 反射
│   └── 01_reflection.go               # reflect 包
│
├── 15_modules/                        # 模块管理
    ├── go.mod                         # 模块定义
    ├── main.go                        # 主程序
    └── pkg/
        └── calculator/
            └── calculator.go          # 子包示例

├── 16_go125_new_features/             # Go 1.25 新特性
│   ├── 01_waitgroup_go.go             # sync.WaitGroup.Go()
│   ├── 02_synctest_basic.go           # testing/synctest 介绍
│   ├── 02_synctest_basic_test.go      # testing/synctest 测试示例
│   ├── 03_os_root.go                  # os.Root 文件系统操作
│   ├── 04_http_csrf.go               # CSRF 防护中间件
│   ├── 05_flight_recorder.go          # 运行时飞行记录器
│   ├── 06_json_v2.go                  # 实验性 JSON API
│   ├── 07_go_mod_ignore.txt           # go.mod ignore 指令
│   └── 08_runtime_features.go         # 运行时新特性

└── 17_structured_logging/             # 结构化日志
    └── 01_slog_basics.go              # log/slog 基础
```

## 快速开始

### 运行单个示例

```bash
# 方式一：直接运行（不生成可执行文件）
cd 01_hello_basics
go run 01_hello_world.go

# 方式二：编译后运行
cd 01_hello_basics
go build 01_hello_world.go
./01_hello_world          # Linux/macOS
01_hello_world.exe        # Windows
```

### 批量编译

```bash
# Windows
build_all.bat

# Linux / macOS / Git Bash
chmod +x build_all.sh
./build_all.sh
```

### 运行测试

```bash
# 运行测试目录的测试
cd 12_testing
go test -v ./...

# 表驱动测试 + 覆盖率
go test -v -cover
go test -coverprofile=coverage.out
go tool cover -html=coverage.out

# 基准测试
go test -bench .
go test -bench Add -benchmem
```

### 模块示例

```bash
cd 15_modules
go run main.go

# 或先编译
go build -o app
./app
```

### Go 1.25 新特性

```bash
# 运行示例（需要 Go 1.25+）
cd 16_go125_new_features
go run 01_waitgroup_go.go
go run 03_os_root.go

# 运行 synctest 测试
cd 16_go125_new_features/synctest
GOWORK=off go test -v

# CSRF 保护服务器（启动后在浏览器访问）
go run 04_http_csrf.go

# 飞行记录器
go run 05_flight_recorder.go

# 运行时特性
go run 08_runtime_features.go
```

### 结构化日志

```bash
cd 17_structured_logging
go run 01_slog_basics.go
```

## 知识点覆盖

本示例覆盖 Go 语言以下核心知识点：

| 分类               | 知识点                                 |
| ------------------ | -------------------------------------- |
| **基础语法**       | 包、导入、变量、常量、iota、数据类型    |
| **流程控制**       | if-else、switch、for、range             |
| **函数**           | 多返回值、命名返回值、闭包、defer       |
| **集合类型**       | 数组、切片、map、字符串操作              |
| **结构体与接口**   | 结构体、方法、嵌入、接口、泛型           |
| **指针**           | 地址、解引用、new                       |
| **错误处理**       | error 接口、自定义错误、panic/recover   |
| **并发编程**       | goroutine、channel、select、sync        |
| **文件 I/O**       | 文件读写、bufio、JSON                   |
| **时间操作**       | 时间格式化、定时器、超时                 |
| **上下文**         | context 取消、超时、传值                 |
| **测试**           | 单元测试、表驱动测试、基准测试、示例测试 |
| **网络编程**       | HTTP 服务器/客户端                      |
| **反射**           | 类型检查、动态调用                      |
| **模块管理**       | go.mod、包组织                          |
| ------------------ | -------------------------------------- |
| **Go 1.25 新特性** | `sync.WaitGroup.Go()`、`testing/synctest` 虚拟时间测试、`os.Root` 文件操作、`net/http.CrossOriginProtection` CSRF 防护、`runtime/trace.FlightRecorder` 飞行记录器、`encoding/json/v2` 实验性 JSON、容器感知 GOMAXPROCS |
| **结构化日志**     | `log/slog` 结构化日志 (JSON/Text, 级别, 分组, 惰性计算) |

## Go 语言特性版本参考

| 版本   | 主要新特性                             |
| ------ | -------------------------------------- |
| 1.18   | 泛型 (Generics)、工作区 (Workspace)     |
| 1.19   | 文档格式化、内存模型修订               |
| 1.20   | 多错误处理 (errors.Join)               |
| 1.21   | 内置 min/max/clear、`log/slog` 结构化日志 |
| 1.22   | 增强 for 循环、range over int、路由增强 |
| 1.23   | 迭代器 (range-over-func)、unique 包     |
| 1.24   | 泛型类型别名、`testing/synctest` 实验性  |
| **1.25** | **`sync.WaitGroup.Go()`、`testing/synctest` GA、`runtime/trace.FlightRecorder` 飞行记录器、`os.Root` 增强、`net/http.CrossOriginProtection` CSRF 保护、`encoding/json/v2` 实验性 JSON、容器感知 GOMAXPROCS、DWARF 5、`go.mod` `ignore` 指令 |

## 学习建议

1. **按目录顺序学习**：从 01 开始，逐步深入
2. **动手运行**：每个示例都设计为可直接编译运行
3. **修改代码**：尝试修改示例代码并观察效果
4. **结合文档**：配合 [Go 官方文档](https://go.dev/doc/) 学习
5. **善用工具**：
   ```bash
   go fmt        # 自动格式化代码
   go vet        # 静态检查
   go run -race  # 检测数据竞争
   go doc fmt    # 查看包文档
   ```

## 许可证

此示例代码仅供学习使用，可自由使用和修改。
