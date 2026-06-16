# Rust 示例代码学习指南

通过动手示例学习 Rust 编程语言，涵盖从基础到高级的完整知识点。
共 **102 个 .rs 文件** + **1 个 Cargo 项目示例**，覆盖 30 个知识领域。

## 学习路线

建议按以下顺序学习，每个知识点目录中的示例也按顺序排列：

### 第一阶段：基础语法

| 目录 | 知识点 | 示例数 | 说明 |
|------|--------|--------|------|
| 01_Hello_World | Hello World | 3 | 第一个程序、注释、格式化输出 |
| 02_Variables_And_Mutability | 变量与可变性 | 3 | 变量绑定、遮蔽、常量 |
| 03_Data_Types | 数据类型 | 6 | 整数、浮点、布尔、字符、元组、数组 |
| 04_Operators | 运算符 | 3 | 算术、比较/逻辑、位运算 |
| 05_Functions | 函数 | 3 | 函数定义、表达式/语句、方法 |
| 06_Control_Flow | 控制流 | 5 | if/else、loop、while/for、match、if let |

### 第二阶段：所有权与核心概念

| 目录 | 知识点 | 示例数 | 说明 |
|------|--------|--------|------|
| 07_Ownership | 所有权 | 6 | 所有权规则、移动/克隆、借用、引用规则、Deref、Drop/RAII |
| 08_References_And_Borrowing | 引用与借用 | 1 | 共享引用 vs 可变引用 |
| 09_Lifetimes | 生命周期 | 4 | 生命周期基础、省略规则、结构体生命周期、'static |
| 10_Structs | 结构体 | 2 | 结构体定义、方法 |
| 11_Enums | 枚举 | 2 | 枚举基础、Option/Result |

### 第三阶段：模式匹配与集合

| 目录 | 知识点 | 示例数 | 说明 |
|------|--------|--------|------|
| 12_Pattern_Matching | 模式匹配 | 3 | 高级 match、模式语法、matches! 宏 |
| 13_Collections | 集合 | 6 | Vec、String、HashMap、HashSet/BTreeMap、BinaryHeap、VecDeque/LinkedList |
| 14_Error_Handling | 错误处理 | 2 | Result 与 ? 运算符、自定义错误类型 |

### 第四阶段：泛型与 Trait

| 目录 | 知识点 | 示例数 | 说明 |
|------|--------|--------|------|
| 15_Generics | 泛型 | 3 | 泛型基础、泛型约束、const 泛型进阶 |
| 16_Traits | Trait | 5 | Trait 定义、派生/关联类型、Trait 对象、类型转换、Borrow/AsRef |
| 17_Closures | 闭包 | 2 | 闭包基础、捕获模式 |
| 18_Iterators | 迭代器 | 2 | Iterator trait、适配器 |

### 第五阶段：智能指针与并发

| 目录 | 知识点 | 示例数 | 说明 |
|------|--------|--------|------|
| 19_Smart_Pointers | 智能指针 | 4 | Box、Rc/Arc、Cell/RefCell、Cow |
| 20_Concurrency | 并发 | 6 | 线程、消息传递、互斥锁、作用域线程、原子类型、OnceLock/LazyLock |
| 21_Async_Await | 异步编程 | 3 | async 基础、Tokio、Future/Pin |

### 第六阶段：进阶主题

| 目录 | 知识点 | 示例数 | 说明 |
|------|--------|--------|------|
| 22_Modules_And_Crates | 模块与包管理 | 3 | 模块（内联+文件分离）、Cargo 特性与依赖 |
| 23_Macros | 宏 | 1 | 声明宏 macro_rules! |
| 24_Unsafe_Rust | Unsafe Rust | 2 | unsafe 基础、裸指针/FFI |
| 25_Testing | 测试 | 2 | 单元测试、断言与基准测试 |
| 26_Advanced_Types | 高级类型 | 4 | Newtype/GAT、关联类型、PhantomData、std::mem 模块 |
| 27_File_IO_And_Std | 文件与标准库 | 5 | 文件读写、Path/环境变量、时间、OsStr、网络编程 |
| 28_Attributes | 属性 | 3 | derive/cfg、repr 内存布局、cfg_attr 等 |
| 29_Advanced_Features | 高级特性 | 1 | let-else、let chains、GAT 等 |
| 30_FFI_And_Interop | FFI | 2 | 外部函数接口、ABI 调用约定 |

## 编译与运行

### 方法一：直接使用 rustc（推荐）

```bash
# 编译单个文件
rustc 01_Hello_World/001_hello_world.rs

# 运行
.\001_hello_world.exe
```

### 方法二：使用 Cargo（带外部依赖）

```bash
# 对于需要 tokio 等外部依赖的示例
cd 21_Async_Await
cargo new demo && cd demo
# 在 Cargo.toml 中添加依赖
# 将示例代码复制到 src/main.rs
cargo run
```

### 模块文件分离的示例

```bash
cd "22_Modules_And_Crates/002_module_separate_file"
rustc main.rs && .\main.exe
```

### Cargo 特性与依赖示例

```bash
cd "22_Modules_And_Crates/003_cargo_features"
cargo build --features "serde,logging"
cargo run
```

## 典型编译命令

```bash
# 基本编译（大多数示例）
rustc 文件名.rs && .\文件名.exe

# 运行测试
rustc --test 文件名.rs && .\文件名.exe

# Release 编译（优化）
rustc -O 文件名.rs && .\文件名.exe
```

## Rust 版本要求

- 大多数示例需要 Rust 1.65+（let-else）
- GAT 示例需要 Rust 1.65+
- async/await 需要 Rust 1.75+
- let chains 需要 Rust 1.77+（实验性功能）

使用 `rustc --version` 查看当前 Rust 版本。

## 学习建议

1. **动手实践**：每个示例都要自己动手编译运行
2. **修改代码**：在理解的基础上修改代码，观察效果
3. **由浅入深**：按上述阶段顺序学习
4. **查阅文档**：遇到问题使用 `rustup doc` 查看官方文档
