// ============================================
// 知识点：项目结构
// 难度：中级
// ============================================

// Rust 项目通常使用 Cargo 管理
// 包含二进制 crate 和库 crate

fn main() {
    println!("=== 项目结构最佳实践 ===");
    
    // ==================== 标准项目结构 ====================
    println!("\n=== 标准项目结构 ===");
    
    println!("my_project/");
    println!("├── Cargo.toml              # 包配置");
    println!("├── Cargo.lock              # 依赖锁定（二进制项目）");
    println!("├── README.md               # 项目说明");
    println!("├── LICENSE.txt             # 许可证");
    println!("├── .gitignore              # Git 忽略");
    println!("├── src/");
    println!("│   ├── main.rs             # 二进制入口");
    println!("│   ├── lib.rs              # 库入口");
    println!("│   ├── error.rs            # 错误定义");
    println!("│   ├── config.rs           # 配置模块");
    println!("│   ├── models/             # 数据模型");
    println!("│   │   ├── mod.rs");
    println!("│   │   ├── user.rs");
    println!("│   │   └── product.rs");
    println!("│   ├── services/           # 业务逻辑");
    println!("│   │   ├── mod.rs");
    println!("│   │   ├── auth.rs");
    println!("│   │   └── database.rs");
    println!("│   └── utils/              # 工具函数");
    println!("│       ├── mod.rs");
    println!("│       └── helpers.rs");
    println!("├── tests/                  # 集成测试");
    println!("│   └── integration_test.rs");
    println!("├── benches/                # 基准测试");
    println!("│   └── benchmark.rs");
    println!("├── examples/               # 示例");
    println!("│   └── example.rs");
    println!("└── doc/                    # 文档");
    
    // ==================== 模块组织 ====================
    println!("\n=== 模块组织 ===");
    
    // src/lib.rs 示例
    println!("// src/lib.rs");
    println!("pub mod error;");
    println!("pub mod config;");
    println!("pub mod models;");
    println!("pub mod services;");
    println!("pub mod utils;");
    
    // src/main.rs 示例
    println!("\n// src/main.rs");
    println!("use my_project::config::Config;");
    println!("use my_project::services::database;");
    println!();
    println!("fn main() {");
    println!("    let config = Config::load();");
    println!("    database::connect(&config);");
    println!("}");
    
    // ==================== 错误处理模块 ====================
    println!("\n=== 错误处理模块 ===");
    
    println!("// src/error.rs");
    println!("#[derive(Debug)]");
    println!("pub enum AppError {");
    println!("    Io(std::io::Error),");
    println!("    Parse(std::num::ParseIntError),");
    println!("    Custom(String),");
    println!("}");
    println!();
    println!("impl std::fmt::Display for AppError {");
    println!("    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {");
    println!("        match self {");
    println!("            AppError::Io(e) => write!(f, \"IO error: {}\", e),");
    println!("            AppError::Parse(e) => write!(f, \"Parse error: {}\", e),");
    println!("            AppError::Custom(e) => write!(f, \"{}\", e),");
    println!("        }");
    println!("    }");
    println!("}");
    
    // ==================== 配置模块 ====================
    println!("\n=== 配置模块 ===");
    
    println!("// src/config.rs");
    println!("#[derive(Debug)]");
    println!("pub struct Config {");
    println!("    pub database_url: String,");
    println!("    pub server_port: u16,");
    println!("}");
    println!();
    println!("impl Config {");
    println!("    pub fn load() -> Self {");
    println!("        Config {");
    println!("            database_url: std::env::var(\"DATABASE_URL\")");
    println!("                .unwrap_or_else(|_| \"localhost\".to_string()),");
    println!("            server_port: 8080,");
    println!("        }");
    println!("    }");
    println!("}");
    
    // ==================== 模型模块 ====================
    println!("\n=== 模型模块 ===");
    
    println!("// src/models/mod.rs");
    println!("pub mod user;");
    println!("pub mod product;");
    println!();
    println!("// src/models/user.rs");
    println!("#[derive(Debug, Clone)]");
    println!("pub struct User {");
    println!("    pub id: u64,");
    println!("    pub name: String,");
    println!("    pub email: String,");
    println!("}");
    println!();
    println!("impl User {");
    println!("    pub fn new(id: u64, name: &str, email: &str) -> Self {");
    println!("        User {");
    println!("            id,");
    println!("            name: name.to_string(),");
    println!("            email: email.to_string(),");
    println!("        }");
    println!("    }");
    println!("}");
    
    // ==================== 服务模块 ====================
    println!("\n=== 服务模块 ===");
    
    println!("// src/services/mod.rs");
    println!("pub mod auth;");
    println!("pub mod database;");
    println!();
    println!("// src/services/database.rs");
    println!("use crate::config::Config;");
    println!();
    println!("pub fn connect(config: &Config) {");
    println!("    println!(\"连接数据库: {}\", config.database_url);");
    println!("}");
    
    // ==================== 工具模块 ====================
    println!("\n=== 工具模块 ===");
    
    println!("// src/utils/mod.rs");
    println!("pub mod helpers;");
    println!();
    println!("// src/utils/helpers.rs");
    println!("pub fn format_size(bytes: u64) -> String {");
    println!("    const KB: u64 = 1024;");
    println!("    const MB: u64 = KB * 1024;");
    println!("    const GB: u64 = MB * 1024;");
    println!();
    println!("    if bytes >= GB {");
    println!("        format!(\"{:.2} GB\", bytes as f64 / GB as f64)");
    println!("    } else if bytes >= MB {");
    println!("        format!(\"{:.2} MB\", bytes as f64 / MB as f64)");
    println!("    } else if bytes >= KB {");
    println!("        format!(\"{:.2} KB\", bytes as f64 / KB as f64)");
    println!("    } else {");
    println!("        format!(\"{} B\", bytes)");
    println!("    }");
    println!("}");
    
    // ==================== 测试组织 ====================
    println!("\n=== 测试组织 ===");
    
    println!("// 单元测试（在源文件中）");
    println!("#[cfg(test)]");
    println!("mod tests {");
    println!("    use super::*;");
    println!();
    println!("    #[test]");
    println!("    fn test_add() {");
    println!("        assert_eq!(add(2, 3), 5);");
    println!("    }");
    println!("}");
    println!();
    println!("// 集成测试（tests/ 目录）");
    println!("// tests/integration_test.rs");
    println!("use my_project;");
    println!();
    println!("#[test]");
    println!("fn test_integration() {");
    println!("    assert_eq!(my_project::add(2, 3), 5);");
    println!("}");
    
    // ==================== 依赖管理 ====================
    println!("\n=== 依赖管理 ===");
    
    println!("// Cargo.toml");
    println!("[package]");
    println!("name = \"my_project\"");
    println!("version = \"0.1.0\"");
    println!("edition = \"2021\"");
    println!();
    println!("[dependencies]");
    println!("serde = {{ version = \"1.0\", features = [\"derive\"] }}");
    println!("tokio = {{ version = \"1\", features = [\"full\"] }}");
    println!("log = \"0.4\"");
    println!("env_logger = \"0.10\"");
    println!();
    println!("[dev-dependencies]");
    println!("tempfile = \"3\"");
    println!("assert_cmd = \"2\"");
    
    // ==================== 发布检查清单 ====================
    println!("\n=== 发布检查清单 ===");
    
    println!("1. 更新版本号");
    println!("2. 更新 CHANGELOG.md");
    println!("3. 运行 cargo test");
    println!("4. 运行 cargo clippy");
    println!("5. 运行 cargo fmt --check");
    println!("6. 运行 cargo doc --open");
    println!("7. 检查 cargo publish --dry-run");
    println!("8. 创建 git tag");
    println!("9. 运行 cargo publish");
    
    // ==================== 项目示例 ====================
    println!("\n=== 创建项目示例 ===");
    
    println!("// 创建新项目");
    println!("cargo new my_project");
    println!("cd my_project");
    println!();
    println!("// 创建库");
    println!("cargo new my_lib --lib");
    println!();
    println!("// 添加依赖");
    println!("cargo add serde --features derive");
    println!("cargo add tokio --features full");
    println!();
    println!("// 运行");
    println!("cargo run");
    println!();
    println!("// 测试");
    println!("cargo test");
    println!();
    println!("// 文档");
    println!("cargo doc --open");
    
    println!("\n项目结构演示完成!");
}

// ============================================
// 编译和运行方法：
// 
// Windows:
//   rustc 01_project_structure.rs -o 01_project_structure.exe
//   01_project_structure.exe
//
// Linux/macOS:
//   rustc 01_project_structure.rs -o 01_project_structure
//   ./01_project_structure
//
// 创建新项目：
//   cargo new my_project
//   cd my_project
//   cargo run
// ============================================
