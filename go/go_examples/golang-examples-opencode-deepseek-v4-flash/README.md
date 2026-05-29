# Go 语言示例代码（覆盖 Go 1.25）

通过示例学习 Go 语言的核心知识点。每个目录对应一个知识点，每个文件聚焦一个细分主题。

## 目录结构

| 目录 | 知识点 | 引入版本 | 内容 |
|------|--------|----------|------|
| 01_hello_world | Hello World | 1.0 | Go 程序入口、fmt 输出 |
| 02_variables_constants | 变量与常量 | 1.0 | var、:=、常量、iota |
| 03_basic_types | 基本数据类型 | 1.0 | bool、int/uint、float、string、byte、rune |
| 04_control_flow | 流程控制 | 1.0/1.22 | if/else、for 循环(+range over int)、switch |
| 05_functions | 函数 | 1.0 | 定义、多返回值、变参、闭包、递归 |
| 06_arrays_slices | 数组与切片 | 1.0 | 数组、切片、append、copy |
| 07_maps | Map | 1.0 | map 创建、增删改查、遍历 |
| 08_structs_methods | 结构体与方法 | 1.0 | struct、方法、结构体嵌入 |
| 09_interfaces | 接口 | 1.0 | 接口定义、隐式实现、类型断言 |
| 10_pointers | 指针 | 1.0 | & 和 *、指针传参 |
| 11_error_handling | 错误处理 | 1.0/1.13 | error、自定义错误、错误链 (%w) |
| 12_defer_panic_recover | defer/panic/recover | 1.0 | 延迟执行、异常恢复 |
| 13_strings | 字符串 | 1.0 | strings 包、rune、Builder |
| 14_file_io | 文件操作 | 1.0 | 读写文件、bufio、追加写入 |
| 15_packages | 包管理 | 1.0 | 自定义包、导入、可见性 |
| 16_goroutines | Goroutine | 1.0 | 并发执行、WaitGroup |
| 17_channels | Channel | 1.0 | 通道通信、缓冲通道 |
| 18_select | Select | 1.0 | 多路复用、超时控制 |
| 19_sync | 并发同步 | 1.0 | Mutex、WaitGroup、Once |
| 20_context | Context | 1.7 | 取消、超时、传值 |
| 21_generics | 泛型 | 1.18 | 类型参数、约束、泛型数据结构 |
| 22_reflection | 反射 | 1.0 | reflect.TypeOf/ValueOf |
| 23_testing | 基础测试 | 1.0 | 单元测试、表驱动测试、基准测试 |
| 24_builtin | 内置 min/max/clear | 1.21 | 内置函数 min、max、clear |
| 25_slog | 结构化日志 | 1.21/1.25 | log/slog、分组、slog.GroupAttrs |
| 26_slices_maps_pkg | slices/maps 包 | 1.21 | BinarySearch、Compact、Clone 等 |
| 27_iterators | 迭代器 | 1.23 | range-over-func、iter 包 |
| 28_net_http | HTTP 路由增强 | 1.22 | 方法路由、路径参数 |
| 29_rand_v2 | math/rand/v2 | 1.22 | ChaCha8、PCG、泛型 N |
| 30_generic_aliases | 泛型类型别名 | 1.24 | 带类型参数的类型别名 |
| 31_unique | 值驻留 unique | 1.23 | unique.Make、Handle |
| 32_sync_advanced | WaitGroup.Go | 1.25 | wg.Go 自动管理 Add/Done |
| 33_testing_advanced | 高级测试 | 1.24+ | b.Loop()、Fuzz、T.Output |
| 34_cmp_pkg | cmp 比较包 | 1.21 | cmp.Or、cmp.Compare/Less |
| 35_structs_pkg | 内存布局控制 | 1.23 | structs.HostLayout |
| 36_os_root | 安全文件隔离 | 1.24 | os.Root 目录隔离 |
| 37_runtime_cleanup | 资源清理 | 1.24 | runtime.AddCleanup |
| 38_sync_once_func | 延迟初始化 | 1.21 | OnceFunc/OnceValue/OnceValues |
| 39_synctest | 并发测试 | 1.25 | 虚拟时钟、气泡隔离 |
| 40_encoding_appender | 零分配序列化 | 1.24 | TextAppender/BinaryAppender |
| **41_context_advanced** | Context 增强 | **1.21** | AfterFunc、WithDeadlineCause |
| **42_http_advanced** | HTTP 增强 | **1.20/1.25** | ResponseController、CSRF 保护 |
| **43_trace_flightrecorder** | 飞行记录器 | **1.25** | trace.FlightRecorder 追踪 |
| **44_reflect_hash** | 反射断言+哈希克隆 | **1.25** | TypeAssert、hash.Cloner |

## 环境要求

- **Go 1.25+** （部分新特性需对应版本支持，见上表"引入版本"列）

## 编译运行方法

### 单个示例运行

```bash
# 直接运行
go run 01_hello_world/01_hello_world.go

# 编译后运行
go build -o hello.exe 01_hello_world/01_hello_world.go
./hello.exe
```

### 编译全部示例（运行根目录下的脚本）

**Windows:**
```bat
build.bat
```

**Linux/macOS:**
```bash
chmod +x build.sh
./build.sh
```

### 运行测试
```bash
go test -v ./23_testing/
go test -v -bench=. ./33_testing_advanced/
go test -fuzz=FuzzDivide ./33_testing_advanced/   # Fuzz 测试
GODEBUG=asynctimerchan=0 go test -v ./39_synctest/  # synctest 需要此环境变量
```

### 追踪工具（43_trace_flightrecorder）
```bash
go run ./43_trace_flightrecorder/01_flightrecorder.go  # 生成 trace 文件
go tool trace /tmp/go_flight_trace.out                  # 在浏览器中查看追踪
```

### 包示例（15_packages + HTTP 服务器）
```bash
# 包管理
cd 15_packages
go mod init examples
go run main.go

# HTTP 服务器（另一个终端访问）
go run 28_net_http/01_http_server.go
# 访问 http://localhost:8080/hello/张三
```

## 学习顺序建议

1. **基础篇**: 01 → 02 → 03 → 04 → 05 → 10
2. **数据结构篇**: 06 → 07 → 08
3. **高级特性篇**: 09 → 11 → 12 → 13 → 14
4. **工程化篇**: 15 → 23 → 25 → 33
5. **并发编程篇**: 16 → 17 → 18 → 19 → 20 → 32
6. **进阶篇**: 21 → 22 → 24 → 26 → 29 → 30
7. **标准库工具篇**: 34 → 35 → 36 → 40
8. **运行期机制篇**: 37 → 38
9. **Go 1.23+ 新特性**: 27 → 28 → 29 → 30 → 31 → 32 → 33 → 34 → 35 → 39 → 40
