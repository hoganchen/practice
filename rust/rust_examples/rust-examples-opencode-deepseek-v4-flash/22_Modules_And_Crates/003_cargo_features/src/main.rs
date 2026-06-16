// ============================================================
// Rust 知识点：Cargo 特性与依赖管理
// 编译：cargo build --features "serde,logging"
// 运行：cargo run --features "extra"
// ============================================================

// ---- 条件编译基于特性 ----
#[cfg(feature = "logging")]
fn init_logging() {
    println!("[日志] 日志系统已初始化");
}

#[cfg(not(feature = "logging"))]
fn init_logging() {
    // 空实现
}

#[cfg(feature = "serde")]
fn serialize_data() -> String {
    #[cfg(feature = "serde")]
    {
        use serde::Serialize;
        #[derive(Serialize)]
        struct Data {
            name: String,
            value: i32,
        }
        let data = Data {
            name: "test".to_string(),
            value: 42,
        };
        serde_json::to_string(&data).unwrap()
    }
}

#[cfg(not(feature = "serde"))]
fn serialize_data() -> String {
    String::from("{\"name\":\"test\",\"value\":42}")
}

#[cfg(feature = "extra")]
fn extra_feature() {
    println!("额外功能已启用");
}

fn main() {
    println!("=== Cargo 特性演示 ===\n");

    // ---- 特性相关输出 ----
    println!("当前启用的特性:");

    #[cfg(feature = "std")]
    println!("  - std (默认特性)");

    #[cfg(feature = "serde")]
    println!("  - serde (支持 JSON 序列化)");

    #[cfg(feature = "extra")]
    println!("  - extra (额外功能)");

    #[cfg(feature = "logging")]
    println!("  - logging (日志功能)");

    // ---- 特性启用后的行为 ----
    init_logging();
    println!("序列化: {}", serialize_data());

    #[cfg(feature = "extra")]
    extra_feature();

    // ---- 平台特定代码 ----
    #[cfg(windows)]
    println!("\n平台: Windows (使用 winapi crate)");

    #[cfg(not(windows))]
    println!("\n平台: Unix");

    // ---- 特性测试 ----
    if cfg!(feature = "logging") {
        println!("\n运行时检查: logging 特性已启用");
    }

    // ---- 编译建议 ----
    println!("\n=== 编译方式 ===");
    println!("cargo build                          # 默认特性");
    println!("cargo build --features serde,logging  # 启用指定特性");
    println!("cargo build --no-default-features     # 禁用默认特性");
    println!("cargo build --all-features            # 启用所有特性");
}
