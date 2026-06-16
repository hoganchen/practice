# Rust 示例代码学习指南

本项目包含一系列 Rust 示例代码，旨在帮助有编程基础的学习者快速掌握 Rust 语言的核心概念。

## 目录结构

```
rust-examples/
├── 01_hello_world/          # Hello World 程序
├── 02_variables/            # 变量绑定
├── 03_data_types/           # 数据类型
├── 04_functions/            # 函数
├── 05_control_flow/         # 控制流
├── 06_structs/              # 结构体
├── 07_enums/                # 枚举
├── 08_pattern_matching/     # 模式匹配
├── 09_modules/              # 模块系统
├── 10_error_handling/       # 错误处理
├── 11_generics/             # 泛型
├── 12_traits/               # Trait
├── 13_lifetimes/            # 生命周期
├── 14_closures/             # 闭包
├── 15_iterators/            # 迭代器
├── 16_smart_pointers/       # 智能指针
├── 17_concurrency/          # 并发编程
├── 18_async_await/          # 异步编程
├── 19_file_io/              # 文件 I/O
├── 20_collections/          # 集合类型
├── 21_traits_object/        # Trait 对象
├── 22_macro/                # 宏
├── 23_unsafe/               # Unsafe Rust
├── 24_crates/               # Crate 和包管理
├── 25_testing/              # 测试
├── 26_project_structure/    # 项目结构
├── 27_common_crates/        # 常用 Crate
├── 28_error_handling_advanced/ # 高级错误处理
├── 29_design_patterns/      # 设计模式
├── 30_performance/          # 性能优化
├── 31_string_types/         # String 与 &str 详解
├── 32_type_conversion/      # From/Into 类型转换
├── 33_trait_bounds/         # Trait Bounds 详解
├── 34_default_trait/        # Default Trait
├── 35_deref_coercion/       # Deref 强制转换
├── 36_drop_trait/           # Drop Trait 详解
├── 37_clone_copy/           # Clone 和 Copy Trait
├── 38_display_debug/        # Display 和 Debug Trait
├── 39_as_ref/               # AsRef/AsMut
├── 40_operator_overloading/ # 运算符重载
├── 41_atomic_types/         # 原子类型
├── 42_rwlock/               # 读写锁
├── 43_channel/              # 通道详解
├── 44_cow/                  # Cow (Clone on Write)
├── 45_ffi/                  # FFI (Foreign Function Interface)
├── 46_phantom_data/         # PhantomData
├── build_all.bat            # Windows 编译脚本
├── build_all.sh             # Linux/macOS 编译脚本
└── readme.md                # 本文件
```

## 快速开始

### 1. 安装 Rust

访问 [rust-lang.org](https://www.rust-lang.org/) 安装 Rust 工具链。

### 2. 编译单个示例

```bash
# Windows
rustc 01_hello_world\01_hello_world.rs -o hello.exe
hello.exe

# Linux/macOS
rustc 01_hello_world/01_hello_world.rs -o hello
./hello
```

### 3. 编译所有示例

```bash
# Windows
build_all.bat

# Linux/macOS
chmod +x build_all.sh
./build_all.sh
```

## 知识点概览

### 入门级 (01-05)

| 目录 | 知识点 | 说明 |
|------|--------|------|
| 01_hello_world | Hello World | 程序入口、注释 |
| 02_variables | 变量绑定 | 不可变/可变变量、常量、遮蔽 |
| 03_data_types | 数据类型 | 标量类型、复合类型 |
| 04_functions | 函数 | 函数定义、参数、返回值 |
| 05_control_flow | 控制流 | if/else、循环、match |

### 中级 (06-15)

| 目录 | 知识点 | 说明 |
|------|--------|------|
| 06_structs | 结构体 | 定义、方法、关联函数 |
| 07_enums | 枚举 | 定义、Option、Result |
| 08_pattern_matching | 模式匹配 | match、if let、解构 |
| 09_modules | 模块系统 | 模块、路径、use |
| 10_error_handling | 错误处理 | Result、?运算符 |
| 11_generics | 泛型 | 泛型函数、结构体、枚举 |
| 12_traits | Trait | 定义、实现、trait bound |
| 13_lifetimes | 生命周期 | 引用有效性、标注 |
| 14_closures | 闭包 | Fn、FnMut、FnOnce |
| 15_iterators | 迭代器 | Iterator trait、适配器 |
| 31_string_types | String 与 &str | 字符串类型详解 |
| 32_type_conversion | 类型转换 | From/Into/TryFrom |
| 33_trait_bounds | Trait Bounds | 泛型约束详解 |
| 34_default_trait | Default Trait | 默认值实现 |
| 37_clone_copy | Clone 和 Copy | 复制语义 |
| 38_display_debug | Display 和 Debug | 格式化输出 |
| 39_as_ref | AsRef/AsMut | 引用转换 |

### 高级 (16-30)

| 目录 | 知识点 | 说明 |
|------|--------|------|
| 16_smart_pointers | 智能指针 | Box、Rc、RefCell |
| 17_concurrency | 并发编程 | 线程、通道、Mutex |
| 18_async_await | 异步编程 | async/await、Future |
| 19_file_io | 文件 I/O | 读写文件、BufReader |
| 20_collections | 集合类型 | Vec、HashMap、HashSet |
| 21_traits_object | Trait 对象 | 动态分发、dyn Trait |
| 22_macro | 宏 | macro_rules!、过程宏 |
| 23_unsafe | Unsafe Rust | 裸指针、unsafe 函数 |
| 24_crates | Crate 管理 | Cargo、依赖管理 |
| 25_testing | 测试 | 单元测试、集成测试 |
| 26_project_structure | 项目结构 | 项目组织、模块 |
| 27_common_crates | 常用 Crate | serde、tokio、clap |
| 28_error_handling_advanced | 高级错误处理 | thiserror、anyhow |
| 29_design_patterns | 设计模式 | 构建者、工厂、观察者 |
| 30_performance | 性能优化 | 零成本抽象、内存优化 |
| 35_deref_coercion | Deref 强制转换 | 智能指针解引用 |
| 36_drop_trait | Drop Trait | 资源清理 |
| 40_operator_overloading | 运算符重载 | 自定义运算符 |
| 41_atomic_types | 原子类型 | 无锁并发 |
| 42_rwlock | 读写锁 | RwLock 使用 |
| 43_channel | 通道 | 线程间通信 |
| 44_cow | Cow | Clone on Write |
| 45_ffi | FFI | 外部函数接口 |
| 46_phantom_data | PhantomData | 零大小类型 |

## 学习建议

1. **循序渐进**：从入门级开始，逐步深入
2. **动手实践**：运行示例代码，修改参数观察变化
3. **理解原理**：不仅要会用，还要理解为什么这样设计
4. **查阅文档**：遇到不懂的可以查阅 [Rust 文档](https://doc.rust-lang.org/)
5. **项目实践**：学完基础后，尝试构建实际项目

## 常用资源

- [Rust 官方文档](https://doc.rust-lang.org/)
- [The Rust Programming Language](https://doc.rust-lang.org/book/)
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/)
- [Rust 异步编程](https://rust-lang.github.io/async-book/)
- [Cargo 文档](https://doc.rust-lang.org/cargo/)

## 许可证

本项目采用 MIT 许可证。

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这些示例代码。
