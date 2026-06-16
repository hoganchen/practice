// ============================================
// 知识点： Crate 和包管理
// 难度：中级
// ============================================

// Rust 使用 Cargo 管理包和依赖
// crate 是编译单元
// 包（package）包含一个或多个 crate

fn main() {
    println!("=== Cargo 和 Crate 基础 ===");
    
    // ==================== Cargo 命令 ====================
    // cargo new project_name    - 创建新项目
    // cargo build               - 构建项目
    // cargo run                 - 运行项目
    // cargo test                - 运行测试
    // cargo doc --open          - 生成文档
    // cargo update              - 更新依赖
    // cargo fmt                 - 格式化代码
    // cargo clippy              - 代码检查
    
    println!("Cargo 命令:");
    println!("  cargo new my_project");
    println!("  cargo build");
    println!("  cargo run");
    println!("  cargo test");
    println!("  cargo doc --open");
    println!("  cargo update");
    println!("  cargo fmt");
    println!("  cargo clippy");
    
    // ==================== 项目结构 ====================
    println!("\n=== 项目结构 ===");
    println!("my_project/");
    println!("├── Cargo.toml      # 包配置");
    println!("├── Cargo.lock      # 依赖锁定");
    println!("├── src/");
    println!("│   ├── main.rs     # 二进制入口");
    println!("│   └── lib.rs      # 库入口");
    println!("├── tests/          # 集成测试");
    println!("├── benches/        # 基准测试");
    println!("└── examples/       # 示例");
    
    // ==================== Cargo.toml ====================
    println!("\n=== Cargo.toml 配置 ===");
    
    // [package]
    // name = "my_project"
    // version = "0.1.0"
    // edition = "2021"
    // authors = ["Your Name <you@example.com>"]
    // description = "A short description"
    // license = "MIT"
    
    // [dependencies]
    // serde = { version = "1.0", features = ["derive"] }
    // tokio = { version = "1", features = ["full"] }
    
    // [dev-dependencies]
    // tempfile = "3"
    
    // [build-dependencies]
    // cc = "1.0"
    
    println!("Cargo.toml 示例:");
    println!("[package]");
    println!("name = \"my_project\"");
    println!("version = \"0.1.0\"");
    println!("edition = \"2021\"");
    println!();
    println!("[dependencies]");
    println!("serde = {{ version = \"1.0\", features = [\"derive\"] }}");
    
    // ==================== 常用 Crate ====================
    println!("\n=== 常用 Crate ===");
    
    let crates = vec![
        ("serde", "序列化/反序列化"),
        ("tokio", "异步运行时"),
        ("reqwest", "HTTP 客户端"),
        ("clap", "命令行参数解析"),
        ("log", "日志接口"),
        ("env_logger", "环境日志"),
        ("chrono", "日期时间处理"),
        ("regex", "正则表达式"),
        ("rand", "随机数生成"),
        ("num", "数值计算"),
    ];
    
    for (name, desc) in &crates {
        println!("  {}: {}", name, desc);
    }
    
    // ==================== 条件编译 ====================
    println!("\n=== 条件编译 ===");
    
    // 根据目标平台编译
    #[cfg(target_os = "windows")]
    println!("运行在 Windows 上");
    
    #[cfg(target_os = "linux")]
    println!("运行在 Linux 上");
    
    #[cfg(target_os = "macos")]
    println!("运行在 macOS 上");
    
    // 根据特性编译
    #[cfg(feature = "advanced")]
    println!("高级特性已启用");
    
    // ==================== 测试 ====================
    println!("\n=== 测试 ===");
    
    // 单元测试
    #[cfg(test)]
    mod tests {
        use super::*;
        
        #[test]
        fn test_addition() {
            assert_eq!(2 + 2, 4);
        }
        
        #[test]
        fn test_string() {
            assert!("hello".contains("ell"));
        }
        
        #[test]
        #[should_panic]
        fn test_panic() {
            panic!("预期的 panic");
        }
        
        #[test]
        fn test_result() -> Result<(), String> {
            if 2 + 2 == 4 {
                Ok(())
            } else {
                Err(String::from("2 + 2 != 4"))
            }
        }
    }
    
    // 运行测试：cargo test
    
    // ==================== 文档测试 ====================
    println!("\n=== 文档测试 ===");
    
    /// 将两个数字相加
    /// 
    /// # 示例
    /// ```
    /// let result = my_crate::add(2, 3);
    /// assert_eq!(result, 5);
    /// ```
    fn add(a: i32, b: i32) -> i32 {
        a + b
    }
    
    let result = add(2, 3);
    println!("add(2, 3) = {}", result);
    
    // ==================== 基准测试 ====================
    println!("\n=== 基准测试 ===");
    
    // 在 benches/ 目录下创建基准测试
    // 使用 criterion 或 test::Bencher
    
    println!("基准测试文件位于 benches/ 目录");
    println!("运行: cargo bench");
    
    // ==================== 发布配置 ====================
    println!("\n=== 发布配置 ===");
    
    // cargo build --release
    // 优化级别: 3
    // 调试信息: 无
    
    println!("开发构建: cargo build");
    println!("发布构建: cargo build --release");
    
    // ==================== 工作空间 ====================
    println!("\n=== 工作空间 ===");
    
    println!("工作空间配置 (Cargo.toml):");
    println!("[workspace]");
    println!("members = [");
    println!("    \"crate1\",");
    println!("    \"crate2\",");
    println!("]");
    
    // ==================== 版本语义 ====================
    println!("\n=== 版本语义 ===");
    
    println!("语义化版本: MAJOR.MINOR.PATCH");
    println!("  MAJOR: 不兼容的 API 修改");
    println!("  MINOR: 向后兼容的功能添加");
    println!("  PATCH: 向后兼容的问题修复");
    
    println!("\n依赖版本示例:");
    println!("  serde = \"1.0\"           # ^1.0.0");
    println!("  serde = \"~1.0.0\"        # >=1.0.0, <1.1.0");
    println!("  serde = \"=1.0.0\"        # 精确版本");
    println!("  serde = \">=1.0, <2.0\"   # 范围");
    
    // ==================== Cargo 特性 ====================
    println!("\n=== Cargo 特性 ===");
    
    println!("特性允许条件编译:");
    println!("[features]");
    println!("default = [\"std\"]");
    println!("std = []");
    println!("advanced = [\"dep:advanced-crate\"]");
    
    println!("\n使用特性:");
    println!("  cargo build --features \"advanced\"");
    println!("  cargo build --no-default-features");
    
    // ==================== 交叉编译 ====================
    println!("\n=== 交叉编译 ===");
    
    println!("安装目标:");
    println!("  rustup target add x86_64-unknown-linux-gnu");
    println!("  rustup target add aarch64-linux-android");
    
    println!("交叉编译:");
    println!("  cargo build --target x86_64-unknown-linux-gnu");
    
    // ==================== 实用工具 ====================
    println!("\n=== 实用工具 ===");
    
    println!("cargo-edit: 添加/删除依赖");
    println!("  cargo install cargo-edit");
    println!("  cargo add serde");
    println!("  cargo rm serde");
    
    println!("cargo-watch: 文件监控");
    println!("  cargo install cargo-watch");
    println!("  cargo watch -x run");
    
    println!("cargo-expand: 宏展开");
    println!("  cargo install cargo-expand");
    println!("  cargo expand");
    
    println!("cargo-audit: 安全审计");
    println!("  cargo install cargo-audit");
    println!("  cargo audit");
    
    println!("\nCrate 和包管理演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_crates.rs -o 01_crates.exe
//   01_crates.exe
//
// Linux/macOS:
//   rustc 01_crates.rs -o 01_crates
//   ./01_crates
//
// 使用 Cargo：
//   cargo new my_project
//   cd my_project
//   cargo run
// ============================================
